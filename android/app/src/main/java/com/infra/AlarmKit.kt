package com.infra

import android.app.Activity
import android.app.AlarmManager
import android.app.KeyguardManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.util.Calendar

// Real alarm clock for personal reminders. Uses AlarmManager.setAlarmClock
// (fires exactly, even in Doze / app closed / after reboot), then rings the
// phone's ALARM sound in a loop until Stop/Snooze, with a full-screen alarm
// screen over the lock screen.
object AlarmStore {
  private const val PREFS = "yi_alarms"
  private fun prefs(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  fun put(c: Context, id: String, j: JSONObject) = prefs(c).edit().putString(id, j.toString()).apply()
  fun get(c: Context, id: String): JSONObject? = prefs(c).getString(id, null)?.let { runCatching { JSONObject(it) }.getOrNull() }
  fun remove(c: Context, id: String) = prefs(c).edit().remove(id).apply()
  fun all(c: Context): Map<String, JSONObject> =
    prefs(c).all.mapNotNull { (k, v) -> runCatching { k to JSONObject(v as String) }.getOrNull() }.toMap()
}

object AlarmScheduler {
  const val CHANNEL = "yi_alarm_v1"
  const val ACTION_FIRE = "com.infra.alarm.FIRE"
  const val ACTION_STOP = "com.infra.alarm.STOP"
  const val ACTION_SNOOZE = "com.infra.alarm.SNOOZE"

  private fun am(c: Context) = c.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  // Next ring time. days = 0..6 (Sun..Sat) it may ring on (empty = every day);
  // date = "YYYY-MM-DD" for a one-off alarm. Returns -1 if it never rings again.
  fun nextTrigger(hour: Int, minute: Int, days: Set<Int> = emptySet(), date: String? = null): Long {
    val now = System.currentTimeMillis() + 1000
    if (!date.isNullOrBlank()) {
      val p = date.split("-").mapNotNull { it.toIntOrNull() }
      if (p.size == 3) {
        val cal = Calendar.getInstance().apply {
          set(p[0], p[1] - 1, p[2], hour, minute, 0); set(Calendar.MILLISECOND, 0)
        }
        return if (cal.timeInMillis > now) cal.timeInMillis else -1
      }
    }
    val cal = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, hour); set(Calendar.MINUTE, minute); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
    }
    for (i in 0..8) {
      val dow = cal.get(Calendar.DAY_OF_WEEK) - 1
      if (cal.timeInMillis > now && (days.isEmpty() || dow in days)) return cal.timeInMillis
      cal.add(Calendar.DAY_OF_YEAR, 1)
    }
    return -1
  }

  fun daysOf(j: JSONObject): Set<Int> =
    j.optString("days", "").split(",").mapNotNull { it.trim().toIntOrNull() }.toSet()

  fun nextFor(j: JSONObject): Long =
    nextTrigger(j.optInt("hour"), j.optInt("minute"), daysOf(j), j.optString("date", "").ifBlank { null })

  private fun firePending(c: Context, id: String): PendingIntent {
    val i = Intent(c, AlarmReceiver::class.java).setAction(ACTION_FIRE).putExtra("id", id)
    return PendingIntent.getBroadcast(c, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun canExact(c: Context) = Build.VERSION.SDK_INT < 31 || am(c).canScheduleExactAlarms()

  fun setAt(c: Context, id: String, at: Long) {
    val pi = firePending(c, id)
    if (canExact(c)) {
      val show = PendingIntent.getActivity(c, id.hashCode() + 1, Intent(c, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      am(c).setAlarmClock(AlarmManager.AlarmClockInfo(at, show), pi)
    } else {
      am(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    }
  }

  fun schedule(c: Context, id: String, hour: Int, minute: Int, title: String, body: String, days: String, date: String?): Long {
    val j = JSONObject().put("hour", hour).put("minute", minute).put("title", title).put("body", body)
      .put("days", days).put("date", date ?: "").put("daily", date.isNullOrBlank())
    val at = nextFor(j)
    am(c).cancel(firePending(c, id))
    if (at < 0) { AlarmStore.remove(c, id); return -1 }
    AlarmStore.put(c, id, j.put("at", at))
    setAt(c, id, at)
    return at
  }

  fun cancel(c: Context, id: String) {
    am(c).cancel(firePending(c, id))
    am(c).cancel(firePending(c, "$id:snooze"))
    AlarmStore.remove(c, id)
    AlarmStore.remove(c, "$id:snooze")
    stopRinging(c, id)
  }

  fun rescheduleAll(c: Context) {
    AlarmStore.all(c).forEach { (id, j) ->
      if (j.optBoolean("snooze")) {
        val at = j.optLong("at")
        if (at > System.currentTimeMillis()) setAt(c, id, at) else AlarmStore.remove(c, id)
      } else {
        val at = nextFor(j)
        if (at < 0) AlarmStore.remove(c, id)
        else { AlarmStore.put(c, id, j.put("at", at)); setAt(c, id, at) }
      }
    }
  }

  fun ensureChannel(c: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (nm.getNotificationChannel(CHANNEL) != null) return
    val ch = NotificationChannel(CHANNEL, "Alarms & reminders", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Your personal reminders ring like an alarm"
      val sound: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
      setSound(sound, AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 800, 500, 800, 500, 800)
      lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    nm.createNotificationChannel(ch)
  }

  fun notifId(id: String) = 900000 + (id.hashCode() and 0xFFFF)

  fun ring(c: Context, id: String, title: String, body: String) {
    ensureChannel(c)
    val full = Intent(c, AlarmActivity::class.java)
      .putExtra("id", id).putExtra("title", title).putExtra("body", body)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION)
    val fullPi = PendingIntent.getActivity(c, id.hashCode() + 2, full, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun action(a: String, code: Int) = PendingIntent.getBroadcast(c, id.hashCode() + code,
      Intent(c, AlarmReceiver::class.java).setAction(a).putExtra("id", id), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val n = NotificationCompat.Builder(c, CHANNEL)
      .setSmallIcon(c.applicationInfo.icon)
      .setContentTitle("⏰ $title")
      .setContentText(body.ifBlank { "Reminder" })
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setFullScreenIntent(fullPi, true)
      .setContentIntent(fullPi)
      .setOngoing(true)
      .setAutoCancel(false)
      .setTimeoutAfter(3 * 60 * 1000L)
      .addAction(0, "Stop", action(ACTION_STOP, 3))
      .addAction(0, "Snooze 10 min", action(ACTION_SNOOZE, 4))
      .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
      .build()
    n.flags = n.flags or android.app.Notification.FLAG_INSISTENT // loop the alarm sound
    (c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(notifId(id), n)
  }

  fun stopRinging(c: Context, id: String) {
    (c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(notifId(id))
  }

  fun snooze(c: Context, id: String) {
    stopRinging(c, id)
    val base = AlarmStore.get(c, id) ?: return
    val sid = if (id.endsWith(":snooze")) id else "$id:snooze"
    val at = System.currentTimeMillis() + 10 * 60 * 1000L
    AlarmStore.put(c, sid, JSONObject(base.toString()).put("snooze", true).put("daily", false).put("at", at))
    setAt(c, sid, at)
  }
}

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(c: Context, intent: Intent) {
    val id = intent.getStringExtra("id") ?: return
    when (intent.action) {
      AlarmScheduler.ACTION_FIRE -> {
        val j = AlarmStore.get(c, id) ?: return
        AlarmScheduler.ring(c, id, j.optString("title", "Reminder"), j.optString("body", ""))
        if (j.optBoolean("snooze") || !j.optBoolean("daily", true)) AlarmStore.remove(c, id)
        else {
          // next matching day, same time
          val at = AlarmScheduler.nextFor(j)
          if (at < 0) AlarmStore.remove(c, id)
          else { AlarmStore.put(c, id, j.put("at", at)); AlarmScheduler.setAt(c, id, at) }
        }
      }
      AlarmScheduler.ACTION_STOP -> AlarmScheduler.stopRinging(c, id)
      AlarmScheduler.ACTION_SNOOZE -> AlarmScheduler.snooze(c, id)
    }
  }
}

class AlarmBootReceiver : BroadcastReceiver() {
  override fun onReceive(c: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.MY_PACKAGE_REPLACED" ||
      intent.action == "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED") {
      AlarmScheduler.rescheduleAll(c)
    }
  }
}

// Full-screen "alarm ringing" screen, shown over the lock screen.
class AlarmActivity : Activity() {
  private var alarmId: String = ""
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= 27) {
      setShowWhenLocked(true); setTurnScreenOn(true)
      (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).requestDismissKeyguard(this, null)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    alarmId = intent.getStringExtra("id") ?: ""
    val title = intent.getStringExtra("title") ?: "Reminder"
    val body = intent.getStringExtra("body") ?: ""
    val dp = resources.displayMetrics.density
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#1F2F5C")); setPadding((28 * dp).toInt(), 0, (28 * dp).toInt(), 0)
    }
    fun text(s: String, size: Float, bold: Boolean, color: String) = TextView(this).apply {
      text = s; textSize = size; setTextColor(Color.parseColor(color)); gravity = Gravity.CENTER
      if (bold) typeface = Typeface.DEFAULT_BOLD; setPadding(0, (6 * dp).toInt(), 0, (6 * dp).toInt())
    }
    val now = java.text.SimpleDateFormat("h:mm a", java.util.Locale.getDefault()).format(java.util.Date())
    root.addView(text("⏰", 64f, false, "#FFFFFF"))
    root.addView(text(now, 44f, true, "#FFFFFF"))
    root.addView(text(title, 26f, true, "#F5D08A"))
    if (body.isNotBlank()) root.addView(text(body, 17f, false, "#C9D3EA"))
    root.addView(text("Shri Yamuna Infra · Reminder", 13f, false, "#8FA0C8"))
    fun button(label: String, bg: String, onClick: () -> Unit) = Button(this).apply {
      text = label; textSize = 18f; setTextColor(Color.WHITE); isAllCaps = false
      setBackgroundColor(Color.parseColor(bg))
      layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, (60 * dp).toInt()).apply { topMargin = (14 * dp).toInt() }
      setOnClickListener { onClick() }
    }
    root.addView(button("Stop", "#E5484D") { AlarmScheduler.stopRinging(this, alarmId); finish() })
    root.addView(button("Snooze 10 min", "#3B5BA9") { AlarmScheduler.snooze(this, alarmId); finish() })
    setContentView(root)
  }
}

class AlarmModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "YIAlarm"

  @ReactMethod
  // days: "1,2,3,4,5" (0=Sun … 6=Sat; "" = every day); date: "YYYY-MM-DD" for a one-off alarm or "".
  fun schedule(id: String, hour: Double, minute: Double, title: String, body: String, days: String, date: String, promise: Promise) {
    try {
      AlarmScheduler.ensureChannel(ctx)
      promise.resolve(AlarmScheduler.schedule(ctx, id, hour.toInt(), minute.toInt(), title, body, days, date.ifBlank { null }).toDouble())
    } catch (e: Exception) { promise.reject("alarm_failed", e.message, e) }
  }

  @ReactMethod
  fun cancel(id: String, promise: Promise) {
    AlarmScheduler.cancel(ctx, id); promise.resolve(true)
  }

  // Cancel every stored alarm not in keep[] (sync with the server list).
  @ReactMethod
  fun sync(keep: com.facebook.react.bridge.ReadableArray, promise: Promise) {
    val ids = (0 until keep.size()).map { keep.getString(it) }.toSet()
    AlarmStore.all(ctx).keys.filter { !it.endsWith(":snooze") && it !in ids }.forEach { AlarmScheduler.cancel(ctx, it) }
    promise.resolve(true)
  }

  @ReactMethod
  fun list(promise: Promise) {
    val arr = Arguments.createArray()
    AlarmStore.all(ctx).forEach { (id, j) ->
      arr.pushMap(Arguments.createMap().apply { putString("id", id); putString("title", j.optString("title")); putDouble("at", j.optLong("at").toDouble()) })
    }
    promise.resolve(arr)
  }

  @ReactMethod
  fun canScheduleExact(promise: Promise) { promise.resolve(AlarmScheduler.canExact(ctx)) }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    try {
      val i = if (Build.VERSION.SDK_INT >= 31) Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}"))
        else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
      ctx.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(true)
    } catch (e: Exception) { promise.resolve(false) }
  }

  // Ring right now (for the "Test alarm" button).
  @ReactMethod
  fun test(title: String, promise: Promise) {
    AlarmScheduler.ensureChannel(ctx)
    val id = "test"
    AlarmStore.put(ctx, id, JSONObject().put("title", title).put("body", "Test alarm").put("daily", false))
    AlarmScheduler.setAt(ctx, id, System.currentTimeMillis() + 5000)
    promise.resolve(true)
  }
}
