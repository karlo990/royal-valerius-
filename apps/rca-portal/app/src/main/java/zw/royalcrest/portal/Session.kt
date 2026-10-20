package zw.royalcrest.portal

import android.content.Context
import org.json.JSONObject

/** The signed-in family, kept in the app's private storage so they stay signed in
 *  across restarts. Only the session token is stored, never the phone-number password. */
data class Session(val token: String, val role: String, val name: String, val students: List<String>)

class SessionStore(context: Context) {
    private val prefs = context.getSharedPreferences("rca_session", Context.MODE_PRIVATE)

    fun load(): Session? {
        val token = prefs.getString("token", null) ?: return null
        return Session(
            token = token,
            role = prefs.getString("role", "parent") ?: "parent",
            name = prefs.getString("name", "") ?: "",
            students = (prefs.getString("students", "") ?: "").split(",").filter { it.isNotBlank() },
        )
    }

    fun save(s: Session) {
        prefs.edit()
            .putString("token", s.token).putString("role", s.role).putString("name", s.name)
            .putString("students", s.students.joinToString(","))
            .putString("last_id", s.students.firstOrNull() ?: lastIdentifier)
            .putLong("saved_at", System.currentTimeMillis())
            .apply()
    }

    /** Called by the portal whenever it learns who is signed in (keeps names and children in sync). */
    fun updateFromPortal(json: JSONObject) {
        val cur = load() ?: return
        val role = json.optString("role", cur.role)
        val ids = json.optJSONArray("students")?.let { a -> List(a.length()) { a.getString(it) } } ?: cur.students
        save(cur.copy(role = role, students = ids))
    }

    fun clear() {
        prefs.edit().remove("token").remove("students").apply()
    }

    var lastIdentifier: String?
        get() = prefs.getString("last_id", null)
        set(v) { prefs.edit().putString("last_id", v).apply() }

    var lastRole: String
        get() = prefs.getString("last_role", "parent") ?: "parent"
        set(v) { prefs.edit().putString("last_role", v).apply() }

    var lastName: String?
        get() = prefs.getString("name", null)
        set(v) { prefs.edit().putString("name", v).apply() }
}
