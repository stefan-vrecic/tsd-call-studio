package com.stefan.callstudio.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer

/** One section waiting in the queue. [endMs] is 0 for "the whole call". */
@Serializable
data class QueueItem(val id: String, val call: String, val startMs: Long, val endMs: Long, val label: String) {
    val key: String get() = "$call|$startMs|$endMs"
}

@Serializable
data class SavedFilters(val mine: String = "ALL", val closers: List<String> = emptyList(), val favourites: Boolean = false)

/** Everything the app remembers about *you* (the library itself is read-only data from the Mac). */
class Prefs(context: Context) {
    private val sp: SharedPreferences = context.getSharedPreferences("callstudio", Context.MODE_PRIVATE)
    private val json = Codec.json

    private fun <T> read(key: String, serializer: kotlinx.serialization.KSerializer<T>, default: T): T =
        try { sp.getString(key, null)?.let { json.decodeFromString(serializer, it) } ?: default } catch (e: Exception) { default }

    private fun <T> write(key: String, serializer: kotlinx.serialization.KSerializer<T>, value: T) {
        sp.edit().putString(key, json.encodeToString(serializer, value)).apply()
    }

    private val favSer = MapSerializer(String.serializer(), Boolean.serializer())
    private val posSer = MapSerializer(String.serializer(), Long.serializer())
    private val queueSer = ListSerializer(QueueItem.serializer())

    var favourites: Map<String, Boolean>
        get() = read("favourites", favSer, emptyMap())
        set(v) = write("favourites", favSer, v)

    var positions: Map<String, Long>
        get() = read("positions", posSer, emptyMap())
        set(v) = write("positions", posSer, v)

    var queue: List<QueueItem>
        get() = read("queue", queueSer, emptyList())
        set(v) = write("queue", queueSer, v)

    var filters: SavedFilters
        get() = read("filters", SavedFilters.serializer(), SavedFilters())
        set(v) = write("filters", SavedFilters.serializer(), v)

    var sortPriority: Boolean
        get() = sp.getBoolean("sortPriority", false)
        set(v) = sp.edit().putBoolean("sortPriority", v).apply()

    var speed: Float
        get() = sp.getFloat("speed", 1f)
        set(v) = sp.edit().putFloat("speed", v).apply()

    var lastKey: String?
        get() = sp.getString("lastKey", null)
        set(v) = sp.edit().putString("lastKey", v).apply()

    var lastLabel: String?
        get() = sp.getString("lastLabel", null)
        set(v) = sp.edit().putString("lastLabel", v).apply()

    var askedNotifications: Boolean
        get() = sp.getBoolean("askedNotifications", false)
        set(v) = sp.edit().putBoolean("askedNotifications", v).apply()
}
