package zw.royalcrest.portal

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import org.json.JSONObject

/** What the portal can tell the app (window.AndroidBridge.postMessage(json)). */
class Bridge(private val onMessage: (JSONObject) -> Unit) {
    private val main = Handler(Looper.getMainLooper())
    @JavascriptInterface
    fun postMessage(json: String) {
        val m = runCatching { JSONObject(json) }.getOrNull() ?: return
        main.post { onMessage(m) }
    }
}

enum class PortalMode { SIGNED_IN, REGISTER, DEMO }

fun online(ctx: Context): Boolean {
    val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
    return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

/** The Crest Quest portal in app mode (?embed=app): app tabs, no website chrome. The saved
 *  session is handed over in the URL fragment (never sent to a server log), so families
 *  open the app straight into their child's progress. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun PortalScreen(
    mode: PortalMode,
    session: Session?,
    deepLink: String?,
    store: SessionStore,
    onSignedOut: (String?) -> Unit,
    onSession: (Session) -> Unit,
    onExit: () -> Unit,
) {
    val ctx = LocalContext.current
    var loading by remember { mutableStateOf(true) }
    var offline by remember { mutableStateOf(false) }
    var web by remember { mutableStateOf<WebView?>(null) }

    val url = remember(mode, session?.token) {
        val q = when (mode) {
            PortalMode.DEMO -> "?embed=app&demo=1"
            else -> "?embed=app&api=${Uri.encode(BuildConfig.HUB_URL)}"
        }
        val hash = when (mode) {
            PortalMode.SIGNED_IN -> "#session=${Uri.encode(session!!.token)}" + (deepLink?.let { "&route=$it" } ?: "")
            PortalMode.REGISTER -> "#register"
            PortalMode.DEMO -> ""
        }
        BuildConfig.PORTAL_URL + q + hash
    }

    BackHandler {
        val w = web
        if (w != null && w.canGoBack()) w.goBack() else onExit()
    }

    Box(Modifier.fillMaxSize().background(GroupedBg)) {
        AndroidView(
            modifier = Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding(),
            factory = { c ->
                WebView(c).apply {
                    web = this
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true          // localStorage survives restarts
                    settings.databaseEnabled = true
                    settings.cacheMode = if (online(c)) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_CACHE_ELSE_NETWORK
                    settings.mediaPlaybackRequiresUserGesture = true
                    settings.userAgentString = settings.userAgentString + " RCAPortal/${BuildConfig.VERSION_NAME}"
                    CookieManager.getInstance().setAcceptCookie(true)
                    overScrollMode = WebView.OVER_SCROLL_NEVER
                    setBackgroundColor(android.graphics.Color.parseColor("#F2F2F7"))
                    addJavascriptInterface(Bridge { m ->
                        when (m.optString("type")) {
                            "rc-portal-ready" -> { store.updateFromPortal(m); loading = false }
                            "rc-session" -> {
                                val u = m.optJSONObject("user")
                                val token = m.optString("token")
                                if (token.isNotBlank() && u != null) {
                                    val ids = u.optJSONArray("students")
                                    onSession(Session(token, u.optString("role", "parent"), u.optString("name"),
                                        ids?.let { a -> List(a.length()) { a.getString(it) } } ?: emptyList()))
                                }
                            }
                            "rc-signed-out" -> onSignedOut(m.optString("reason").ifBlank { null })
                            "rc-close" -> onExit()
                        }
                    }, "AndroidBridge")
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                            val u = req.url
                            val portalHost = Uri.parse(BuildConfig.PORTAL_URL).host
                            if ((u.scheme == "https" || u.scheme == "http") && u.host == portalHost && u.path?.startsWith("/portal") == true) return false
                            if (u.scheme == "royalcrest") return false
                            // phone calls, WhatsApp, email, the website and report cards open outside the app
                            runCatching { c.startActivity(Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
                            return true
                        }
                        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) { offline = false }
                        override fun onPageFinished(view: WebView, url: String?) {
                            // the portal also reports ready itself; this covers the sign-in and register pages
                            Handler(Looper.getMainLooper()).postDelayed({ loading = false }, 400)
                        }
                        override fun onReceivedError(view: WebView, req: WebResourceRequest, err: WebResourceError) {
                            if (req.isForMainFrame) { offline = true; loading = false }
                        }
                    }
                    loadUrl(url)
                }
            },
        )

        AnimatedVisibility(loading, exit = fadeOut()) { Splash() }

        if (offline) {
            Column(Modifier.fillMaxSize().background(GroupedBg).padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center) {
                Text("You're offline", style = text(28, FontWeight.Bold))
                Spacer(Modifier.height(8.dp))
                Text("RCA Portal needs the internet to fetch the latest marks and fees. You're still signed in.",
                    style = text(15, color = Secondary), textAlign = TextAlign.Center)
                Spacer(Modifier.height(24.dp))
                BigButton("Try again") {
                    web?.settings?.cacheMode = if (online(ctx)) WebSettings.LOAD_DEFAULT else WebSettings.LOAD_CACHE_ELSE_NETWORK
                    offline = false; loading = true; web?.loadUrl(url)
                }
            }
        }
    }
    DisposableEffect(Unit) { onDispose { web?.destroy() } }
}

@Composable
fun Splash() {
    Column(Modifier.fillMaxSize().background(GroupedBg), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center) {
        Box(Modifier.size(96.dp).clip(RoundedCornerShape(26.dp)).background(androidx.compose.ui.graphics.Color.White).padding(12.dp)) {
            Image(painterResource(R.drawable.crest), null)
        }
        Spacer(Modifier.height(18.dp))
        Text("RCA Portal", style = text(22, FontWeight.Bold))
        Spacer(Modifier.height(18.dp))
        CircularProgressIndicator(Modifier.size(22.dp), color = Navy, strokeWidth = 2.dp)
    }
}
