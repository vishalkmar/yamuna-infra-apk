package com.infra

import android.app.Activity
import android.content.Intent
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Opens the system picker (Photos / Files / Drive) and returns the chosen
// file as { uri, name, size, type } — used for chat attachments. The content://
// uri can be sent straight in a multipart FormData upload.
class FilePickerModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx), ActivityEventListener {
  private var pending: Promise? = null

  init { ctx.addActivityEventListener(this) }

  override fun getName() = "YIFilePicker"

  @ReactMethod
  fun pick(kind: String, promise: Promise) {
    val activity = ctx.currentActivity
    if (activity == null) { promise.reject("no_activity", "App is not in front"); return }
    pending?.resolve(null)
    pending = promise
    val types = when (kind) {
      "image" -> arrayOf("image/*")
      "media" -> arrayOf("image/*", "video/*")
      else -> arrayOf("image/*", "video/*", "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain")
    }
    val intent = Intent(Intent.ACTION_GET_CONTENT)
      .addCategory(Intent.CATEGORY_OPENABLE)
      .setType(if (types.size == 1) types[0] else "*/*")
      .putExtra(Intent.EXTRA_MIME_TYPES, types)
    try {
      activity.startActivityForResult(Intent.createChooser(intent, "Attach"), REQ)
    } catch (e: Exception) {
      pending = null
      promise.reject("picker_failed", e.message, e)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQ) return
    val p = pending ?: return
    pending = null
    val uri = data?.data
    if (resultCode != Activity.RESULT_OK || uri == null) { p.resolve(null); return }
    try {
      var name = "attachment"
      var size = 0.0
      ctx.contentResolver.query(uri, null, null, null, null)?.use { c ->
        if (c.moveToFirst()) {
          val ni = c.getColumnIndex(OpenableColumns.DISPLAY_NAME)
          if (ni >= 0) name = c.getString(ni) ?: name
          val si = c.getColumnIndex(OpenableColumns.SIZE)
          if (si >= 0) size = c.getLong(si).toDouble()
        }
      }
      val map = Arguments.createMap()
      map.putString("uri", uri.toString())
      map.putString("name", name)
      map.putDouble("size", size)
      map.putString("type", ctx.contentResolver.getType(uri) ?: "application/octet-stream")
      p.resolve(map)
    } catch (e: Exception) {
      p.reject("picker_failed", e.message, e)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  companion object { const val REQ = 47311 }
}
