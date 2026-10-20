package zw.royalcrest.portal

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// iOS-style system colours, tinted with the school's navy and gold.
val Navy = Color(0xFF0C1638)
val NavyLight = Color(0xFF1C2D72)
val Gold = Color(0xFFD2AE4C)
val GroupedBg = Color(0xFFF2F2F7)      // iOS systemGroupedBackground
val Card = Color.White
val Label = Color(0xFF111827)
val Secondary = Color(0xFF6B7280)      // iOS secondaryLabel
val Separator = Color(0x1F3C3C43)
val Fill = Color(0x1F767680)           // iOS tertiarySystemFill
val Danger = Color(0xFFD70015)

val Newsreader = FontFamily(Font(R.font.newsreader_semibold, FontWeight.SemiBold))
val Jakarta = FontFamily(
    Font(R.font.jakarta_regular, FontWeight.Normal),
    Font(R.font.jakarta_semibold, FontWeight.SemiBold),
    Font(R.font.jakarta_bold, FontWeight.Bold),
)

fun text(size: Int, weight: FontWeight = FontWeight.Normal, color: Color = Label, family: FontFamily = Jakarta) =
    TextStyle(fontFamily = family, fontWeight = weight, fontSize = size.sp, lineHeight = (size * 1.3f).sp, color = color, letterSpacing = (-0.2).sp)

@Composable
fun RcaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = lightColorScheme(primary = Navy, background = GroupedBg, surface = Card), content = content)
}
