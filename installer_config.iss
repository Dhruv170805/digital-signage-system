; --- NEXUS DIGITAL SIGNAGE INSTALLER SCRIPT ---
[Setup]
AppName=Nexus Signage System
AppVersion=1.0.0
DefaultDirName={commonpf}\NexusSignage
DefaultGroupName=NexusSignage
OutputDir=dist\installer
OutputBaseFilename=NexusSignageSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
SetupIconFile=client\public\favicon.svg

[Files]
; The launcher executable (built via pkg)
Source: "dist\launcher-win.exe"; DestDir: "{app}"; DestName: "launcher.exe"; Flags: ignoreversion
; Include the bundled server and frontend build
Source: "server\*"; DestDir: "{app}\server"; Flags: recursesubdirs createallsubdirs
Source: "client\dist\*"; DestDir: "{app}\client\dist"; Flags: recursesubdirs createallsubdirs
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Nexus Signage"; Filename: "{app}\launcher.exe"
Name: "{commondesktop}\Nexus Signage"; Filename: "{app}\launcher.exe"

[Run]
; Launch the app automatically after installation
Filename: "{app}\launcher.exe"; Description: "Launch Nexus Signage System"; Flags: nowait postinstall skipifsilent
