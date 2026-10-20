package zw.royalcrest.portal

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

class ApiException(message: String) : Exception(message)

/** The one native call: sign-in. Everything else happens inside the portal. */
object Api {
    suspend fun login(role: String, admission: String, password: String): Session = withContext(Dispatchers.IO) {
        val body = JSONObject().put("role", role).put("identifier", admission.trim()).put("password", password.trim())
        val c = (URL("${BuildConfig.HUB_URL}/api/v1/auth/login").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 20_000
            readTimeout = 60_000            // a sleeping Space can take a while to wake
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("User-Agent", "RCAPortal-Android/${BuildConfig.VERSION_NAME}")
        }
        try {
            c.outputStream.use { it.write(body.toString().toByteArray()) }
            val code = c.responseCode
            val text = (if (code in 200..299) c.inputStream else c.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
            if (code !in 200..299) {
                val detail = runCatching { JSONObject(text).optString("detail") }.getOrNull()
                throw ApiException(
                    when {
                        !detail.isNullOrBlank() -> detail
                        code == 503 || code == 502 -> "The school server is waking up. Try again in a minute."
                        else -> "Could not sign in (error $code)."
                    }
                )
            }
            val j = JSONObject(text)
            val u = j.getJSONObject("user")
            val ids = u.getJSONArray("students")
            Session(j.getString("token"), u.optString("role", role), u.optString("name"), List(ids.length()) { ids.getString(it) })
        } catch (e: IOException) {
            throw ApiException("No connection to the school server. Check your data or Wi-Fi and try again.")
        } finally {
            c.disconnect()
        }
    }
}
