# The hidden test environment: a throwaway MySQL server, the plugin server from this repo and a hidden MySQL
# Workbench with its own profile and a debug port. Your everyday Workbench (debug port 9229, if you use one) and
# its profile are never touched.
#
#   powershell -File tests/testenv.ps1 start [-Visible] [-Reseed]
#   powershell -File tests/testenv.ps1 status
#   powershell -File tests/testenv.ps1 stop
#
#   MySQL      127.0.0.1:3310, data in test-mysql\data, root with an EMPTY password (made with
#              --initialize-insecure, localhost only, throwaway). kgptalkie_test is loaded from tests\fixtures.
#   Server     package\kgptalkie_workbench.py --serve on 127.0.0.1:9241, AI settings in tests\.ai (not committed).
#   Workbench  --renderer-url=http://127.0.0.1:9241/ --electron-user-data-dir=test-profile, hidden unless -Visible,
#              Chrome DevTools Protocol on 127.0.0.1:9230.
param(
    [ValidateSet('start', 'stop', 'status')][string]$Action = 'status',
    [switch]$Visible,
    [switch]$Reseed
)
$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $PSScriptRoot
$TestProfile = Join-Path $Repo 'test-profile'
$MyDir = Join-Path $Repo 'test-mysql'
$MyIni = Join-Path $MyDir 'my.ini'
$AiDir = Join-Path $PSScriptRoot '.ai'
$PidFile = Join-Path $PSScriptRoot '.server.pid'
$DbPort = 3310; $SrvPort = 9241; $CdpPort = 9230
if ($CdpPort -eq 9229) { throw 'Port 9229 belongs to the everyday Workbench.' }
$Wb = Join-Path $env:LOCALAPPDATA 'Programs\MySQL\MySQL Workbench\MySQL Workbench.exe'
$MySqlBin = $env:KGPTALKIE_MYSQL_BIN
if (-not $MySqlBin) {
    $d = Get-ChildItem 'C:\Program Files\MySQL\MySQL Server *\bin\mysqld.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($d) { $MySqlBin = $d.DirectoryName }
}

function Listening([int]$port) {
    [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}
function WaitPort([int]$port, [int]$seconds) {
    for ($i = 0; $i -lt $seconds * 2; $i++) { if (Listening $port) { return $true }; Start-Sleep -Milliseconds 500 }
    $false
}
function TestWorkbench {
    Get-CimInstance Win32_Process -Filter "Name='MySQL Workbench.exe'" |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($TestProfile) }
}
function TestMysqld {
    Get-CimInstance Win32_Process -Filter "Name='mysqld.exe'" |
        Where-Object { $_.CommandLine -and $_.CommandLine.Contains($MyIni) }
}
# The mysql client warns on stderr, which Windows PowerShell would turn into an error under 'Stop'.
function Sql([string]$sql) {
    $ErrorActionPreference = 'Continue'
    & (Join-Path $MySqlBin 'mysql.exe') '--host=127.0.0.1' "--port=$DbPort" '--user=root' --skip-password -N -e $sql 2>&1 |
        Where-Object { $_ -isnot [Management.Automation.ErrorRecord] }
    if ($LASTEXITCODE) { throw "mysql failed (exit $LASTEXITCODE)" }
}
function SqlFile([string]$file) {
    $p = Start-Process -Wait -PassThru -NoNewWindow (Join-Path $MySqlBin 'mysql.exe') `
        -ArgumentList '--host=127.0.0.1', "--port=$DbPort", '--user=root', '--skip-password' -RedirectStandardInput $file `
        -RedirectStandardError (Join-Path $MyDir 'load.err')
    if ($p.ExitCode) { throw "Loading $file failed; see $MyDir\load.err" }
}
# What holds the plugin port: 'free', 'repo' (our server, serving this repo's plugin), 'other-copy', 'foreign'
function ServerState {
    try {
        $r = Invoke-WebRequest "http://127.0.0.1:$SrvPort/kgptalkie/kgptalkie-plugin.js" -UseBasicParsing -TimeoutSec 3
    } catch {
        if ($_.Exception.Response) { return 'foreign' }
        return 'free'
    }
    $bytes = $r.RawContentStream.ToArray()
    $body = [Text.Encoding]::UTF8.GetString($bytes)
    if (-not $body.Contains('Modern MySQL Workbench plugin')) { return 'foreign' }
    $sha = [Security.Cryptography.SHA256]::Create()
    $theirs = [BitConverter]::ToString($sha.ComputeHash($bytes))
    $mine = [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes((Join-Path $Repo 'plugin\kgptalkie-plugin.js'))))
    if ($theirs -eq $mine) { 'repo' } else { 'other-copy' }
}

function Start-Db {
    if (Listening $DbPort) {
        if (-not (TestMysqld)) { throw "Port $DbPort is used by a MySQL server that is not the test one." }
        "MySQL      already running on $DbPort"
    } else {
        if (-not $MySqlBin) { throw 'MySQL Server binaries not found. Set KGPTALKIE_MYSQL_BIN to its bin folder.' }
        New-Item -ItemType Directory -Force $MyDir | Out-Null
        $base = (Split-Path -Parent $MySqlBin) -replace '\\', '/'
        $dir = $MyDir -replace '\\', '/'
        (Get-Content (Join-Path $PSScriptRoot 'my.ini.template') -Raw).Replace('{{BASEDIR}}', $base).Replace('{{DIR}}', $dir) |
            Set-Content -Encoding ascii $MyIni
        if (-not (Test-Path (Join-Path $MyDir 'data'))) {
            "MySQL      creating a new throwaway data folder (empty root password, localhost only)"
            $ErrorActionPreference = 'Continue'; & (Join-Path $MySqlBin 'mysqld.exe') "--defaults-file=$MyIni" --initialize-insecure
            if ($LASTEXITCODE) { throw "mysqld --initialize-insecure failed; see $MyDir\error.log" }
        }
        Start-Process -WindowStyle Hidden (Join-Path $MySqlBin 'mysqld.exe') "--defaults-file=`"$MyIni`""
        if (-not (WaitPort $DbPort 60)) { throw "The test MySQL server did not start; see $MyDir\error.log" }
        "MySQL      started on $DbPort"
    }
    $has = Sql "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='kgptalkie_test'"
    if ($Reseed -or "$has".Trim() -ne '1') {
        SqlFile (Join-Path $PSScriptRoot 'fixtures\kgptalkie_test.sql')
        "MySQL     kgptalkie_test loaded from tests\fixtures\kgptalkie_test.sql"
    }
}

function Start-Server {
    switch (ServerState) {
        'repo' { "Server     already serving this repo's plugin on $SrvPort"; return }
        'other-copy' { throw "Port $SrvPort is held by a plugin server with a different plugin copy (an installed Modern MySQL Workbench?). Close Modern MySQL Workbench and wait for its server to stop, then try again." }
        'foreign' { throw "Port $SrvPort is in use by another program." }
    }
    New-Item -ItemType Directory -Force $AiDir | Out-Null
    $env:KGPTALKIE_AI_DIR = $AiDir
    $p = Start-Process -PassThru -WindowStyle Hidden py -ArgumentList @("`"$(Join-Path $Repo 'package\kgptalkie_workbench.py')`"", '--serve', '--port', "$SrvPort") -WorkingDirectory (Join-Path $Repo 'package')
    Set-Content $PidFile $p.Id
    for ($i = 0; $i -lt 40 -and (ServerState) -ne 'repo'; $i++) { Start-Sleep -Milliseconds 250 }
    if ((ServerState) -ne 'repo') { throw 'The plugin server did not start.' }
    "Server     started on $SrvPort (AI settings in tests\.ai)"
}

function Start-Wb {
    if (Listening $CdpPort) {
        if (-not (TestWorkbench)) { throw "Port $CdpPort is used by something that is not the test Workbench." }
        "Workbench  already running (debug port $CdpPort)"; return
    }
    if (-not (Test-Path $Wb)) { throw "MySQL Workbench not found at $Wb" }
    $wbArgs = @("--renderer-url=http://127.0.0.1:$SrvPort/", "--electron-user-data-dir=`"$TestProfile`"",
        "--remote-debugging-port=$CdpPort", "--remote-allow-origins=http://127.0.0.1:$CdpPort")
    if (-not $Visible) { $wbArgs += '--electron-e2e-background=true' }
    Start-Process $Wb -ArgumentList $wbArgs
    if (-not (WaitPort $CdpPort 60)) { throw 'The test Workbench did not open its debug port.' }
    "Workbench  started $(if ($Visible) { 'visible' } else { 'hidden' }), debug port $CdpPort, profile test-profile\"
}

switch ($Action) {
    'start' { Start-Db; Start-Server; Start-Wb }
    'status' {
        "MySQL      $(if (TestMysqld) { "running on $DbPort" } else { 'stopped' })"
        "Server     $(ServerState) on $SrvPort"
        "Workbench  $(if (TestWorkbench) { "running, debug port $CdpPort" } else { 'stopped' })"
    }
    'stop' {
        TestWorkbench | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        "Workbench  stopped"
        if (Test-Path $PidFile) {
            if ((ServerState) -eq 'repo') {
                try { Invoke-WebRequest "http://127.0.0.1:$SrvPort/kgptalkie/quit" -Headers @{ 'X-KGPTalkie' = '1' } -UseBasicParsing -TimeoutSec 3 | Out-Null } catch { }
            }
            Remove-Item $PidFile
            "Server     stopped"
        } else { "Server     left running (not started by this script)" }
        if (TestMysqld) {
            $ErrorActionPreference = 'Continue'; & (Join-Path $MySqlBin 'mysqladmin.exe') '--host=127.0.0.1' "--port=$DbPort" '--user=root' --skip-password shutdown 2>$null
            Start-Sleep 2
            TestMysqld | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        }
        "MySQL      stopped"
    }
}
