package com.infra

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.webkit.MimeTypeMap
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

// Saves a file straight into the phone's public Downloads folder using the
// system DownloadManager (shows progress + a "tap to open" notification).
// No storage permission is needed on Android 10+.
class FileDownloadModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "YIDownloader"

  private fun dm() = ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

  @ReactMethod
  fun download(url: String, fileName: String, title: String, promise: Promise) {
    try {
      val safe = fileName.replace(Regex("[^A-Za-z0-9._ -]+"), "_").take(100)
      val ext = MimeTypeMap.getFileExtensionFromUrl(safe)
      val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/pdf"
      val req = DownloadManager.Request(Uri.parse(url))
        .setTitle(title)
        .setDescription("Yamuna Infra")
        .setMimeType(mime)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "YamunaInfra/$safe")
        .setAllowedOverMetered(true)
        .setAllowedOverRoaming(true)
      val id = dm().enqueue(req)
      promise.resolve(id.toDouble())
    } catch (e: Exception) {
      promise.reject("download_failed", e.message, e)
    }
  }

  // 'running' | 'done' | 'failed'
  @ReactMethod
  fun status(id: Double, promise: Promise) {
    try {
      val c = dm().query(DownloadManager.Query().setFilterById(id.toLong()))
      c.use {
        if (!it.moveToFirst()) { promise.resolve("failed"); return }
        val s = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
        promise.resolve(
          when (s) {
            DownloadManager.STATUS_SUCCESSFUL -> "done"
            DownloadManager.STATUS_FAILED -> "failed"
            else -> "running"
          },
        )
      }
    } catch (e: Exception) {
      promise.resolve("failed")
    }
  }

  // Open a finished download in the phone's PDF viewer.
  @ReactMethod
  fun open(id: Double, promise: Promise) {
    try {
      val uri = dm().getUriForDownloadedFile(id.toLong())
      if (uri == null) { promise.resolve(false); return }
      val mime = dm().getMimeTypeForDownloadedFile(id.toLong()) ?: "application/pdf"
      val intent = Intent(Intent.ACTION_VIEW)
        .setDataAndType(uri, mime)
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(Intent.createChooser(intent, "Open with").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }
}

class FileDownloadPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> = listOf(FileDownloadModule(ctx), FilePickerModule(ctx), AlarmModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
