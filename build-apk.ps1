# Build do APK release - configura ambiente e roda o Gradle.
# Uso: clique direito > "Executar com PowerShell", ou: powershell -ExecutionPolicy Bypass -File build-apk.ps1
$ErrorActionPreference = "Stop"

$env:JAVA_HOME       = "C:\Program Files (x86)\Android\openjdk\jdk-17.0.14"
# SDK gravavel (o de Program Files e read-only e nao tem o NDK 27 exigido pelo RN 0.81)
$env:ANDROID_HOME    = "C:\Android\sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# IMPORTANTE: a pasta TEMP padrao do usuario quebra os sockets AF_UNIX que o
# JDK 17+ usa para o self-pipe do Selector NIO -> Gradle falha com
# "Unable to establish loopback connection". Redirecionar TMP/TEMP para uma
# pasta limpa resolve.
if (-not (Test-Path "C:\jtmp")) { New-Item -ItemType Directory "C:\jtmp" | Out-Null }
$env:TMP = "C:\jtmp"; $env:TEMP = "C:\jtmp"

Set-Location "$PSScriptRoot\android"
Write-Host "Iniciando build (assembleRelease)..." -ForegroundColor Cyan
& ".\gradlew.bat" assembleRelease
$code = $LASTEXITCODE

if ($code -eq 0) {
  $apk = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
  Write-Host "`nBUILD OK. APK em:`n$apk" -ForegroundColor Green
} else {
  Write-Host "`nBUILD FALHOU (exit $code)." -ForegroundColor Red
}
exit $code
