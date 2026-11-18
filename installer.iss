; Inno Setup Script for Lead Finder v2
; Generates a professional, single-file Windows installer: "lead finder v2.exe"

#define MyAppName "Lead Finder v2"
#define MyAppVersion "2.0.1"
#define MyAppPublisher "LeadPulse AI"
#define MyAppURL "https://github.com/social-lead-finder"
#define MyAppExeName "SocialLeadFinder.exe"
#define SetupBaseName "lead finder v2"

[Setup]
AppId={{D37F8E92-B481-4C79-881E-4B07D3E8C182}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Lead Finder v2
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=installer_dist
OutputBaseFilename={#SetupBaseName}
SetupIconFile=assets\app.ico
UninstallDisplayIcon={app}\app.ico
UninstallDisplayName={#MyAppName}
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesInstallIn64BitMode=x64compatible
AppMutex=SocialLeadFinderSingleInstanceMutex
CloseApplications=yes
RestartApplications=no
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "envpath"; Description: "Add Lead Finder v2 to User PATH environment variable"; GroupDescription: "System Integration:"; Flags: unchecked

[Files]
; Main application binaries and dependencies bundled by PyInstaller
Source: "dist\SocialLeadFinder\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Application icon
Source: "assets\app.ico"; DestDir: "{app}"; Flags: ignoreversion
; Default initial configuration template
Source: "assets\default_config.json"; DestDir: "{userappdata}\SocialLeadFinder\config"; DestName: "settings.json"; Flags: onlyifdoesntexist
; Microsoft Edge WebView2 Evergreen Bootstrapper prerequisite payload
Source: "assets\MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall
; Mobile Android Companion APK
Source: "android_dist\lead-finder-v2.apk"; DestDir: "{app}\mobile"; Flags: ignoreversion

[Dirs]
; Pre-provision runtime data, logs, and configuration directories in %APPDATA%\SocialLeadFinder
Name: "{userappdata}\SocialLeadFinder"; Flags: uninsneveruninstall
Name: "{userappdata}\SocialLeadFinder\data"; Flags: uninsneveruninstall
Name: "{userappdata}\SocialLeadFinder\logs"; Flags: uninsneveruninstall
Name: "{userappdata}\SocialLeadFinder\config"; Flags: uninsneveruninstall
Name: "{app}\mobile"; Flags: uninsneveruninstall

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"
Name: "{group}\Mobile Android APK"; Filename: "{app}\mobile\lead-finder-v2.apk"; IconFilename: "{app}\app.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Registry]
; Register App Paths for Windows Run dialog (Win+R) and command prompt execution
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#MyAppExeName}"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#MyAppExeName}"; ValueType: string; ValueName: "Path"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\leadfinder.exe"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\leadfinder.exe"; ValueType: string; ValueName: "Path"; ValueData: "{app}"; Flags: uninsdeletekey

; Application Metadata
Root: HKCU; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#MyAppPublisher}\{#MyAppName}"; ValueType: string; ValueName: "DataPath"; ValueData: "{userappdata}\SocialLeadFinder"; Flags: uninsdeletekey

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent
; Configure Windows Firewall for mobile device companion sync
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""Lead Finder v2"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden; StatusMsg: "Configuring Windows Firewall for mobile phone companion sync..."

[UninstallRun]
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""Lead Finder v2"" program=""{app}\{#MyAppExeName}"""; Flags: runhidden

[Code]
// Helper: Check if Microsoft Edge WebView2 Runtime is installed
function IsWebView2Installed(): Boolean;
var
  VersionStr: String;
begin
  Result := False;
  // 1. Check 64-bit machine registry
  if RegQueryStringValue(HKLM64, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BCD-66C3A88B05E1}', 'pv', VersionStr) then
  begin
    if (VersionStr <> '') and (VersionStr <> '0.0.0.0') then
      Result := True;
  end;

  // 2. Check 32-bit machine registry (WOW6432Node)
  if not Result then
  begin
    if RegQueryStringValue(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BCD-66C3A88B05E1}', 'pv', VersionStr) then
    begin
      if (VersionStr <> '') and (VersionStr <> '0.0.0.0') then
        Result := True;
    end;
  end;

  // 3. Check Current User registry
  if not Result then
  begin
    if RegQueryStringValue(HKCU, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BCD-66C3A88B05E1}', 'pv', VersionStr) then
    begin
      if (VersionStr <> '') and (VersionStr <> '0.0.0.0') then
        Result := True;
    end;
  end;
end;

// Helper: Check Visual C++ 2015-2022 x64 Redistributable
function IsVCRedistInstalled(): Boolean;
var
  Installed: Cardinal;
begin
  Result := False;
  if RegQueryDWordValue(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed) then
    Result := (Installed = 1);
  if not Result then
    if RegQueryDWordValue(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed) then
      Result := (Installed = 1);
end;

// Helper: Add or Remove Directory from User PATH
procedure ModifyUserPath(AppPath: String; AddToPath: Boolean);
var
  CurrentPath: String;
  NewPath: String;
begin
  if not RegQueryStringValue(HKCU, 'Environment', 'PATH', CurrentPath) then
    CurrentPath := '';

  if AddToPath then
  begin
    if Pos(AppPath, CurrentPath) = 0 then
    begin
      if CurrentPath = '' then
        NewPath := AppPath
      else
        NewPath := CurrentPath + ';' + AppPath;
      RegWriteStringValue(HKCU, 'Environment', 'PATH', NewPath);
      Log('Added application path to User PATH environment variable.');
    end;
  end
  else
  begin
    if Pos(AppPath, CurrentPath) > 0 then
    begin
      StringChange(CurrentPath, ';' + AppPath, '');
      StringChange(CurrentPath, AppPath + ';', '');
      StringChange(CurrentPath, AppPath, '');
      RegWriteStringValue(HKCU, 'Environment', 'PATH', CurrentPath);
      Log('Removed application path from User PATH environment variable.');
    end;
  end;
end;

// Event: Installation Steps
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  BootstrapperPath: String;
begin
  if CurStep = ssPostInstall then
  begin
    Log('Entering post-installation configuration step...');

    // 1. Check and install WebView2 prerequisite if missing
    if not IsWebView2Installed() then
    begin
      Log('Prerequisite Notice: Microsoft Edge WebView2 Runtime is not installed.');
      BootstrapperPath := ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe');
      if FileExists(BootstrapperPath) then
      begin
        Log('Executing bundled Microsoft Edge WebView2 Evergreen Bootstrapper silently...');
        WizardForm.StatusLabel.Caption := 'Installing Microsoft Edge WebView2 Runtime prerequisite...';
        if Exec(BootstrapperPath, '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
        begin
          if ResultCode = 0 then
            Log('Microsoft Edge WebView2 Runtime installed successfully.')
          else
            Log('WebView2 Bootstrapper exited with code: ' + IntToStr(ResultCode));
        end
        else
        begin
          Log('Warning: Could not launch WebView2 Bootstrapper. Built-in web browser fallback will be used.');
        end;
      end;
    end
    else
    begin
      Log('Prerequisite check passed: Microsoft Edge WebView2 Runtime is installed.');
    end;

    // 2. Log Visual C++ Runtime status
    if IsVCRedistInstalled() then
      Log('Prerequisite check passed: Visual C++ 2015-2022 x64 Runtime is installed.')
    else
      Log('Notice: Visual C++ system runtime not detected. Application will rely on bundled C runtime binaries.');

    // 3. User PATH integration if selected
    if WizardIsTaskSelected('envpath') then
    begin
      ModifyUserPath(ExpandConstant('{app}'), True);
    end;

    Log('Post-installation configuration complete.');
  end;
end;

// Event: Uninstallation Steps
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  AppDataDir: String;
begin
  if CurUninstallStep = usUninstall then
  begin
    // Clean PATH environment entry if present
    ModifyUserPath(ExpandConstant('{app}'), False);
  end
  else if CurUninstallStep = usPostUninstall then
  begin
    AppDataDir := ExpandConstant('{userappdata}\SocialLeadFinder');
    if DirExists(AppDataDir) then
    begin
      if MsgBox('Would you like to completely remove your saved leads database and settings?' + #13#10 + #13#10 +
                'Folder: ' + AppDataDir + #13#10 + #13#10 +
                'Click "Yes" to delete all application data.' + #13#10 +
                'Click "No" to keep your leads safe for future use.',
                mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES then
      begin
        if DelTree(AppDataDir, True, True, True) then
          Log('Successfully removed user AppData directory.')
        else
          Log('Could not remove user AppData directory.');
      end
      else
      begin
        Log('User chose to preserve application data directory.');
      end;
    end;
  end;
end;
