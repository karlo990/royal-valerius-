package zw.royalcrest.portal

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

sealed interface Screen {
    data class Welcome(val message: String? = null) : Screen
    data class Portal(val mode: PortalMode, val session: Session?) : Screen
}

class MainActivity : ComponentActivity() {
    private lateinit var store: SessionStore
    private var deepLink by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        store = SessionStore(this)
        deepLink = routeFrom(intent)
        val saved = store.load()
        var screen by mutableStateOf<Screen>(if (saved != null) Screen.Portal(PortalMode.SIGNED_IN, saved) else Screen.Welcome())

        setContent {
            RcaTheme {
                AnimatedContent(screen, transitionSpec = { fadeIn() togetherWith fadeOut() }, label = "screen",
                    contentKey = { it::class to (it as? Screen.Portal)?.mode }) { s ->
                    when (s) {
                        is Screen.Welcome -> WelcomeScreen(
                            store, s.message,
                            onSignedIn = { screen = Screen.Portal(PortalMode.SIGNED_IN, it) },
                            onRegister = { screen = Screen.Portal(PortalMode.REGISTER, null) },
                            onDemo = { screen = Screen.Portal(PortalMode.DEMO, null) },
                        )
                        is Screen.Portal -> PortalScreen(
                            s.mode, s.session, deepLink, store,
                            onSignedOut = { reason ->
                                store.clear()
                                screen = Screen.Welcome(reason?.let { "Your session ended. Please sign in again." })
                            },
                            onSession = { store.save(it); screen = Screen.Portal(PortalMode.SIGNED_IN, it) },
                            onExit = { if (s.mode == PortalMode.SIGNED_IN) finish() else screen = Screen.Welcome() },
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        deepLink = routeFrom(intent)
    }

    /** royalcrest://portal/fees → "fees" */
    private fun routeFrom(intent: Intent?): String? =
        intent?.data?.takeIf { it.scheme == "royalcrest" }?.pathSegments?.firstOrNull()
}
