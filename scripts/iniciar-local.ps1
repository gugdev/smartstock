param([switch]$SemNavegador)
$ErrorActionPreference = 'Stop'
$projeto = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node -ErrorAction Stop).Source
if (!(Test-Path (Join-Path $projeto 'node_modules/vite/bin/vite.js'))) {
    throw 'Instale as dependências com npm ci antes de iniciar.'
}
if (!(Test-Path (Join-Path $projeto '.env'))) { throw 'Crie o .env seguindo o README.' }

# Caminhos opcionais do PostgreSQL portátil desta máquina, fora do repositório público.
$arquivoLocal = Join-Path $projeto '.local.json'
if (Test-Path $arquivoLocal) {
    $local = Get-Content -LiteralPath $arquivoLocal -Raw | ConvertFrom-Json
    if (!(Test-NetConnection 127.0.0.1 -Port $local.porta -InformationLevel Quiet -WarningAction SilentlyContinue)) {
        $controle = Join-Path $local.bin 'pg_ctl.exe'
        $argumentos = @('-D', ('"' + $local.dados + '"'), '-l', ('"' + $local.log + '"'), '-o', ('"-p ' + $local.porta + ' -h 127.0.0.1"'), 'start')
        $processo = Start-Process -FilePath $controle -ArgumentList $argumentos -WindowStyle Hidden -Wait -PassThru
        if ($processo.ExitCode -ne 0) { throw 'PostgreSQL não iniciou. Confira o log local.' }
    }
}

function Verificar-Api {
    try { return (Invoke-RestMethod 'http://127.0.0.1:3001/api/saude' -TimeoutSec 2).status -eq 'ok' }
    catch { return $false }
}
if (!(Verificar-Api)) {
    Start-Process -FilePath $node -ArgumentList 'server/index.js' -WorkingDirectory $projeto -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projeto 'api.log') -RedirectStandardError (Join-Path $projeto 'api-erro.log')
}
$pronta = $false
for ($tentativa = 0; $tentativa -lt 10; $tentativa++) {
    if (Verificar-Api) { $pronta = $true; break }
    Start-Sleep -Milliseconds 500
}
if (!$pronta) { throw 'API indisponível. Confira PostgreSQL, .env e api-erro.log.' }
if (!(Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $node -ArgumentList 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort' -WorkingDirectory $projeto -WindowStyle Hidden -RedirectStandardOutput (Join-Path $projeto 'front.log') -RedirectStandardError (Join-Path $projeto 'front-erro.log')
}
if (Get-Command code -ErrorAction SilentlyContinue) { & code --reuse-window $projeto }
if (!$SemNavegador) { Start-Process 'http://127.0.0.1:5173' }
Write-Host 'SmartStock: http://127.0.0.1:5173 | Swagger: http://127.0.0.1:3001/api/docs/'
