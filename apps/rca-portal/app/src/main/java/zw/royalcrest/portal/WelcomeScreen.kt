package zw.royalcrest.portal

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

/** Sign-in, iPhone style: a large title, one inset-grouped card with two rows, and a big button.
 *  No account to create: the school already knows the admission number and the parent's phone. */
@Composable
fun WelcomeScreen(
    store: SessionStore,
    message: String?,
    onSignedIn: (Session) -> Unit,
    onRegister: () -> Unit,
    onDemo: () -> Unit,
) {
    var role by remember { mutableStateOf(store.lastRole) }
    var admission by remember { mutableStateOf(store.lastIdentifier ?: "") }
    var phone by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf(message) }
    var shown by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val focus = LocalFocusManager.current
    LaunchedEffect(Unit) { shown = true }

    fun submit() {
        if (admission.isBlank() || phone.isBlank()) { error = "Enter the admission number and the phone number."; return }
        focus.clearFocus()
        busy = true; error = null
        scope.launch {
            try {
                val s = Api.login(role, admission, phone)
                store.lastRole = role
                store.save(s)
                onSignedIn(s)
            } catch (e: ApiException) {
                error = e.message
            } finally {
                busy = false
            }
        }
    }

    Box(Modifier.fillMaxSize().background(GroupedBg)) {
        // soft navy glow behind the crest
        Box(
            Modifier.fillMaxWidth().height(360.dp).background(
                Brush.verticalGradient(listOf(Navy, NavyLight.copy(alpha = .92f), GroupedBg))
            )
        )
        Column(
            Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()
                .verticalScroll(rememberScrollState()).padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(36.dp))
            AnimatedVisibility(shown, enter = fadeIn() + slideInVertically { -it / 3 }) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        Modifier.size(104.dp).shadow(18.dp, RoundedCornerShape(28.dp)).clip(RoundedCornerShape(28.dp))
                            .background(Color.White).padding(12.dp),
                        contentAlignment = Alignment.Center,
                    ) { Image(painterResource(R.drawable.crest), contentDescription = "Royal Crest Academy crest") }
                    Spacer(Modifier.height(18.dp))
                    Text("RCA Portal", style = text(34, FontWeight.Bold, Color.White))
                    Text(
                        if (store.lastName.isNullOrBlank()) "Marks, attendance, homework and fees for Royal Crest Academy families."
                        else "Welcome back, ${store.lastName}.",
                        style = text(15, color = Color.White.copy(alpha = .82f)), textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 6.dp, start = 12.dp, end = 12.dp),
                    )
                }
            }
            Spacer(Modifier.height(30.dp))

            Segmented(listOf("parent" to "Parent", "learner" to "Learner"), role) { role = it }
            Spacer(Modifier.height(14.dp))

            // inset grouped card
            Column(Modifier.fillMaxWidth().shadow(1.dp, RoundedCornerShape(14.dp)).clip(RoundedCornerShape(14.dp)).background(Card)) {
                FieldRow("Admission no.", admission, "RCA-27-0142", KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters, keyboardType = KeyboardType.Ascii, imeAction = ImeAction.Next,
                ), onNext = { focus.moveFocus(androidx.compose.ui.focus.FocusDirection.Down) }) { admission = it.uppercase() }
                Box(Modifier.padding(start = 16.dp).fillMaxWidth().height(0.6.dp).background(Separator))
                FieldRow(if (role == "parent") "Your phone" else "Parent's phone", phone, "0771 234 567", KeyboardOptions(
                    keyboardType = KeyboardType.Phone, imeAction = ImeAction.Go,
                ), secret = true, onNext = { submit() }) { phone = it }
            }
            Text(
                if (role == "parent") "Your password is the phone number the school has for you. You stay signed in on this phone."
                else "Use a parent's phone number, unless you've set your own password.",
                style = text(13, color = Secondary), modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, top = 8.dp),
            )

            AnimatedVisibility(error != null) {
                Text(error ?: "", style = text(14, FontWeight.SemiBold, Danger), textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 14.dp))
            }
            Spacer(Modifier.height(22.dp))
            BigButton(if (busy) "Signing in…" else "Sign In", busy) { submit() }
            Spacer(Modifier.height(18.dp))

            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Card)) {
                LinkRow("New parent? Register in a minute", "No password to create") { onRegister() }
                Box(Modifier.padding(start = 16.dp).fillMaxWidth().height(0.6.dp).background(Separator))
                LinkRow("Look around with sample data", "Demo, no sign-in") { onDemo() }
            }
            Spacer(Modifier.height(26.dp))
            Text("Royal Crest Academy · 1226 Chinobva, Nyika, Masvingo\nHelp: +263 714 404 090", style = text(12, color = Secondary),
                textAlign = TextAlign.Center)
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun Segmented(options: List<Pair<String, String>>, selected: String, onPick: (String) -> Unit) {
    BoxWithConstraints(Modifier.fillMaxWidth().height(36.dp).clip(RoundedCornerShape(9.dp)).background(Color(0xFFE3E3E8)).padding(2.dp)) {
        val w = maxWidth / options.size
        val idx = options.indexOfFirst { it.first == selected }.coerceAtLeast(0)
        val x by animateDpAsState(w * idx, spring(dampingRatio = .8f, stiffness = 500f), label = "seg")
        Box(Modifier.offset(x = x).width(w).fillMaxSize().shadow(2.dp, RoundedCornerShape(7.dp)).clip(RoundedCornerShape(7.dp)).background(Color.White))
        Row(Modifier.fillMaxSize()) {
            options.forEach { (k, label) ->
                Box(Modifier.width(w).fillMaxSize().clickable(remember { MutableInteractionSource() }, null) { onPick(k) }, contentAlignment = Alignment.Center) {
                    Text(label, style = text(14, if (k == selected) FontWeight.SemiBold else FontWeight.Normal))
                }
            }
        }
    }
}

@Composable
private fun FieldRow(
    label: String, value: String, placeholder: String, keyboard: KeyboardOptions, secret: Boolean = false,
    onNext: () -> Unit, onChange: (String) -> Unit,
) {
    Row(Modifier.fillMaxWidth().height(52.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = text(16), modifier = Modifier.width(128.dp))
        Box(Modifier.weight(1f)) {
            if (value.isEmpty()) Text(placeholder, style = text(16, color = Color(0xFFB0B3BD)))
            BasicTextField(
                value, onChange, singleLine = true, textStyle = text(16), cursorBrush = SolidColor(Navy),
                keyboardOptions = keyboard, keyboardActions = KeyboardActions(onNext = { onNext() }, onGo = { onNext() }),
                visualTransformation = if (secret) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
fun BigButton(label: String, busy: Boolean = false, onClick: () -> Unit) {
    val bg by animateColorAsState(if (busy) NavyLight else Navy, label = "btn")
    Row(
        Modifier.fillMaxWidth().height(52.dp).clip(RoundedCornerShape(14.dp)).background(bg).clickable(enabled = !busy) { onClick() },
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
    ) {
        if (busy) { CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp); Spacer(Modifier.width(10.dp)) }
        Text(label, style = text(17, FontWeight.SemiBold, Color.White))
    }
}

@Composable
private fun LinkRow(title: String, hint: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable { onClick() }.padding(horizontal = 16.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = text(16, color = NavyLight))
            Text(hint, style = text(13, color = Secondary))
        }
        Text("›", style = text(22, color = Color(0xFFC4C4C9)))
    }
}
