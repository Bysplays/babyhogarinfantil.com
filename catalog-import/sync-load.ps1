$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
$docker='C:\Program Files\Docker\Docker\resources\bin\docker.exe'
do {
  $running=& $docker compose -f ../compose.yaml exec -T prestashop sh -c "pgrep -f '[p]hp /tmp/bhi-catalog/load-prestashop.php'"
  if($running){Start-Sleep -Seconds 10}
} while($running)
for($pass=1;$pass -le 12;$pass++) {
  node prepare-extra-categories.mjs
  & $docker compose -f ../compose.yaml cp load-prestashop.php prestashop:/tmp/bhi-catalog/load-prestashop.php
  & $docker compose -f ../compose.yaml cp migration/discovery.json prestashop:/tmp/bhi-catalog/migration/discovery.json
  & $docker compose -f ../compose.yaml cp migration/extra-categories.json prestashop:/tmp/bhi-catalog/migration/extra-categories.json
  & $docker compose -f ../compose.yaml cp migration/stage/products/. prestashop:/tmp/bhi-catalog/migration/stage/products/
  & $docker compose -f ../compose.yaml cp migration/stage/assets/. prestashop:/tmp/bhi-catalog/migration/stage/assets/
  & $docker compose -f ../compose.yaml exec -T prestashop php /tmp/bhi-catalog/load-prestashop.php *> "load-pass-$pass.log"
  & $docker compose -f ../compose.yaml cp prestashop:/tmp/bhi-catalog/database-map.json database-map.json
  $state=Get-Content database-map.json -Raw | ConvertFrom-Json
  $harvest=Get-Content migration/stage/import-all-report.json -Raw | ConvertFrom-Json
  $count=@($state.done.PSObject.Properties).Count
  Write-Output "Pass $pass. Database products: $count"
  if($harvest.finishedAt -and $count -eq $harvest.detected){break}
  if($harvest.finishedAt -and $harvest.errors.Count){Write-Output 'Download errors require review.';break}
  Start-Sleep -Seconds 10
}
