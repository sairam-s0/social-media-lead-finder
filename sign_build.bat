@echo off
REM ============================================================================
REM Code Signing Automation Script for Social Lead Finder
REM Signs binaries using Windows SDK signtool.exe with OV / EV Certificates
REM ============================================================================

set SIGNTOOL="C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe"
if not exist %SIGNTOOL% (
    set SIGNTOOL=signtool.exe
)

set TIMESTAMP_URL=http://timestamp.digicert.com

echo ===================================================
echo Code-Signing Social Lead Finder Executables
echo ===================================================

REM Check for Certificate File or Certificate Thumbprint
if "%~1"=="" (
    echo [INFO] Usage: sign_build.bat ^<path_to_pfx^> ^<pfx_password^>
    echo [INFO] Or for Hardware Token (EV Certificate):
    echo        signtool.exe sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /sha1 ^<THUMBPRINT^> "dist\SocialLeadFinder\SocialLeadFinder.exe"
    echo.
    echo Testing signtool availability...
    where signtool >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [NOTICE] signtool is not currently in system PATH. Install Windows SDK to sign for production.
    ) else (
        echo [OK] signtool found.
    )
    goto end
)

set PFX_FILE=%~1
set PFX_PASS=%~2

echo Signing Application Executable: dist\SocialLeadFinder\SocialLeadFinder.exe ...
%SIGNTOOL% sign /f "%PFX_FILE%" /p "%PFX_PASS%" /fd SHA256 /tr %TIMESTAMP_URL% /td SHA256 /d "Social Lead Finder" "dist\SocialLeadFinder\SocialLeadFinder.exe"

if exist "installer_dist\SocialLeadFinder_Setup_v1.0.0.exe" (
    echo Signing Installer: installer_dist\SocialLeadFinder_Setup_v1.0.0.exe ...
    %SIGNTOOL% sign /f "%PFX_FILE%" /p "%PFX_PASS%" /fd SHA256 /tr %TIMESTAMP_URL% /td SHA256 /d "Social Lead Finder Setup" "installer_dist\SocialLeadFinder_Setup_v1.0.0.exe"
)

echo [SUCCESS] Code signing complete.
:end
