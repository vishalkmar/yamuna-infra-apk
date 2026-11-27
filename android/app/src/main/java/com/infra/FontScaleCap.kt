package com.infra

import android.content.Context
import android.content.res.Configuration

/**
 * Caps Android's system font scale for this app.
 *
 * Residents (many seniors) often set "Font size: Largest" (1.3–2.0×). React
 * Native scales every <Text> by that factor, which overflowed fixed-size cards
 * and tiles on the home screen. We still honour the setting, but only up to
 * MAX so layouts stay intact on every phone.
 */
object FontScaleCap {
  const val MAX = 1.15f

  fun wrap(base: Context): Context {
    val current = base.resources.configuration
    if (current.fontScale <= MAX) return base
    val cfg = Configuration(current)
    cfg.fontScale = MAX
    return base.createConfigurationContext(cfg)
  }
}
