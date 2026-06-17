# Build the inf2 "Yamuna Infra" release APK and push it to the phone's Download folder.
# RUN THIS FROM A PLAIN POWERSHELL WINDOW WITH VSCODE / CLAUDE CODE / BROWSERS CLOSED
# (the machine only has ~200 MB RAM free otherwise and Gradle will OOM).
#
# Usage:  cd to this folder, then:  .\build-and-install.ps1

$ErrorActionPreference = 'Stop'
$proj = "C:\Users\DELL\Desktop\infra\inf2\infra\infra"
$adb  = "C:\Users\DELL\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apk  = "$proj\android\app\build\outputs\apk\release\app-release.apk"

Write-Host "==> Building release APK (this can take several minutes)..." -ForegroundColor Cyan
Set-Location "$proj\android"
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED (likely OOM). Close more apps and retry." -ForegroundColor Red; exit 1 }

if (-not (Test-Path $apk)) { Write-Host "APK not found at $apk" -ForegroundColor Red; exit 1 }

Write-Host "==> Pushing APK to phone /sdcard/Download/ ..." -ForegroundColor Cyan
& $adb push $apk /sdcard/Download/yamuna-infra.apk
if ($LASTEXITCODE -ne 0) { Write-Host "adb push failed. Is the phone connected + USB debugging on?" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "DONE. On the phone: open Files / File Manager -> Download -> tap 'yamuna-infra.apk' -> Install." -ForegroundColor Green
Write-Host "(MIUI blocks 'adb install', so you install from the file manager.)" -ForegroundColor Green
