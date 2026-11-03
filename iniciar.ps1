$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$dockerBin = 'C:\Program Files\Docker\Docker\resources\bin'
if (Test-Path $dockerBin) { $env:PATH = $dockerBin + ';' + $env:PATH }
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar. Comprueba que Docker Desktop esté funcionando.' }
Write-Host 'Tienda: http://localhost:8080/'
Write-Host 'Administracion: http://localhost:8080/administracion-baby/'
Write-Host 'La primera instalación puede tardar unos minutos.'
