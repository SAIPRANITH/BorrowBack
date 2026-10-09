$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$mobileDirectory = $PSScriptRoot
$repositoryRoot = Split-Path $mobileDirectory -Parent
$jdkDirectory = if ($env:JAVA_HOME) { $env:JAVA_HOME } else {
    Join-Path $env:LOCALAPPDATA 'Programs\Microsoft\jdk-17.0.10.7-hotspot'
}
$sdkDirectory = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else {
    Join-Path $env:LOCALAPPDATA 'Android\Sdk'
}
$keyDirectory = Join-Path $env:LOCALAPPDATA 'BorrowBack\android-signing'
$keyStorePath = Join-Path $keyDirectory 'borrowback-release.jks'
$encryptedPasswordPath = Join-Path $keyDirectory 'password.dpapi'
$keyTool = Join-Path $jdkDirectory 'bin\keytool.exe'

if (-not (Test-Path -LiteralPath $keyTool)) {
    throw "Java 17 keytool was not found at '$keyTool'. Set JAVA_HOME to a Java 17 installation."
}
if (-not (Test-Path -LiteralPath (Join-Path $sdkDirectory 'cmdline-tools\latest\bin\sdkmanager.bat'))) {
    throw "Android SDK command-line tools were not found under '$sdkDirectory'. Set ANDROID_HOME to an installed SDK."
}

New-Item -ItemType Directory -Path $keyDirectory -Force | Out-Null
if (-not (Test-Path -LiteralPath $keyStorePath)) {
    if (Test-Path -LiteralPath $encryptedPasswordPath) {
        throw 'The signing password exists but its keystore is missing. Restore the keystore backup before building.'
    }

    $passwordBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($passwordBytes)
    $password = [Convert]::ToBase64String($passwordBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    $env:BORROWBACK_UPLOAD_STORE_PASSWORD = $password

    & $keyTool -genkeypair -v -keystore $keyStorePath -alias borrowback `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -dname 'CN=BorrowBack Android' `
        -storepass:env BORROWBACK_UPLOAD_STORE_PASSWORD `
        -keypass:env BORROWBACK_UPLOAD_STORE_PASSWORD
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not create the Android release signing key.'
    }

    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    ConvertFrom-SecureString $securePassword |
        Set-Content -LiteralPath $encryptedPasswordPath -NoNewline
    Remove-Item Env:BORROWBACK_UPLOAD_STORE_PASSWORD
}
elseif (-not (Test-Path -LiteralPath $encryptedPasswordPath)) {
    throw 'The release signing password is missing. Restore it from the Windows user account that created the keystore.'
}

$securePassword = ConvertTo-SecureString (Get-Content -LiteralPath $encryptedPasswordPath -Raw)
$env:BORROWBACK_UPLOAD_STORE_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
$env:BORROWBACK_UPLOAD_STORE_FILE = $keyStorePath
$env:JAVA_HOME = $jdkDirectory
$env:ANDROID_HOME = $sdkDirectory
$env:ANDROID_SDK_ROOT = $sdkDirectory
$env:Path = "$jdkDirectory\bin;$sdkDirectory\platform-tools;$env:Path"

Push-Location $mobileDirectory
try {
    & npx.cmd expo prebuild --platform android
    if ($LASTEXITCODE -ne 0) {
        throw 'Expo could not generate the Android project.'
    }

    $wrapperPropertiesPath = Join-Path $mobileDirectory 'android\gradle\wrapper\gradle-wrapper.properties'
    $wrapperProperties = Get-Content -LiteralPath $wrapperPropertiesPath -Raw
    if ($wrapperProperties -notmatch '(?m)^networkTimeout=\d+$') {
        throw 'The generated Gradle wrapper has no network timeout setting.'
    }
    $wrapperProperties = $wrapperProperties -replace '(?m)^networkTimeout=\d+$', 'networkTimeout=120000'
    [System.IO.File]::WriteAllText(
        $wrapperPropertiesPath,
        $wrapperProperties,
        (New-Object System.Text.UTF8Encoding -ArgumentList $false)
    )

    $gradlePath = Join-Path $mobileDirectory 'android\app\build.gradle'
    $gradle = Get-Content -LiteralPath $gradlePath -Raw
    $signingMarker = '    signingConfigs {'
    if (-not $gradle.Contains('borrowbackRelease')) {
        if (-not $gradle.Contains($signingMarker)) {
            throw 'The generated Android Gradle file has no signing configuration block.'
        }
        $releaseConfig = @'
        borrowbackRelease {
            storeFile file(System.getenv("BORROWBACK_UPLOAD_STORE_FILE"))
            storePassword System.getenv("BORROWBACK_UPLOAD_STORE_PASSWORD")
            keyAlias "borrowback"
            keyPassword System.getenv("BORROWBACK_UPLOAD_STORE_PASSWORD")
        }
'@
        $gradle = $gradle.Replace($signingMarker, "$signingMarker`n$releaseConfig")
    }

    $debugSigning = 'signingConfig signingConfigs.debug'
    $releaseSigningIndex = $gradle.LastIndexOf($debugSigning, [StringComparison]::Ordinal)
    if ($releaseSigningIndex -lt 0) {
        throw 'The generated release build type could not be found for signing.'
    }
    $gradle = $gradle.Remove($releaseSigningIndex, $debugSigning.Length)
    $gradle = $gradle.Insert($releaseSigningIndex, 'signingConfig signingConfigs.borrowbackRelease')
    [System.IO.File]::WriteAllText(
        $gradlePath,
        $gradle,
        (New-Object System.Text.UTF8Encoding -ArgumentList $false)
    )

    Push-Location (Join-Path $mobileDirectory 'android')
    try {
        & .\gradlew.bat assembleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a'
        if ($LASTEXITCODE -ne 0) {
            throw 'The Android release build failed.'
        }
    }
    finally {
        Pop-Location
    }

    $apkPath = Join-Path $mobileDirectory 'android\app\build\outputs\apk\release\app-release.apk'
    if (-not (Test-Path -LiteralPath $apkPath)) {
        throw 'Gradle completed without producing the expected APK.'
    }

    $downloadDirectory = Join-Path $repositoryRoot 'client\public\downloads'
    New-Item -ItemType Directory -Path $downloadDirectory -Force | Out-Null
    $downloadPath = Join-Path $downloadDirectory 'BorrowBack.apk'
    Copy-Item -LiteralPath $apkPath -Destination $downloadPath -Force

    $apksigner = Get-ChildItem -LiteralPath (Join-Path $sdkDirectory 'build-tools') `
        -Filter apksigner.bat -Recurse |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if (-not $apksigner) {
        throw 'The Android SDK apksigner tool is missing; the APK signature could not be verified.'
    }
    & $apksigner.FullName verify --verbose $downloadPath
    if ($LASTEXITCODE -ne 0) {
        throw 'The generated APK signature did not verify.'
    }

    Write-Output "Signed APK: $downloadPath"
    Write-Output "Signing key backup: $keyStorePath"
}
finally {
    Pop-Location
    Remove-Item Env:BORROWBACK_UPLOAD_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:BORROWBACK_UPLOAD_STORE_FILE -ErrorAction SilentlyContinue
}
