# Builds dist\Workbench-KGP-Setup.exe (one file: installer + launcher + plugin server, plugin bundled).
#   powershell -File build.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$work = Join-Path $env:TEMP 'workbench-kgp-build'
$plugin = Join-Path (Split-Path -Parent $here) 'plugin\kgp-plugin.js'
py (Join-Path $here 'make_icon.py')
py -m PyInstaller --noconfirm --clean --onefile --noconsole --name 'Workbench-KGP-Setup' `
  --icon (Join-Path $here 'icon.ico') `
  --add-data "$plugin;plugin" `
  --distpath (Join-Path $here 'dist') --workpath (Join-Path $work 'build') --specpath $work `
  (Join-Path $here 'kgp_workbench.py')
if ($LASTEXITCODE) { throw "PyInstaller failed ($LASTEXITCODE)" }
Get-Item (Join-Path $here 'dist\Workbench-KGP-Setup.exe') | Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
