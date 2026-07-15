$psBefore = @(Get-Process -Name powershell -ErrorAction SilentlyContinue).Count
Write-Host "PowerShell before: $psBefore"

Write-Host "Starting installed app..."
Start-Process 'C:\Users\sunruohao\AppData\Local\Programs\calendar-app\日历清单.exe'
Start-Sleep 5
$app = @(Get-Process -Name '日历清单' -ErrorAction SilentlyContinue)
if ($app) { Write-Host "Install version: OK ($($app.Count) pids)" }
else { Write-Host "Install version: FAIL" }

Write-Host "Killing and simulating boot auto-start..."
taskkill /f /im '日历清单.exe' 2>$null
Start-Sleep 2

$cmd = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run').PSObject.Properties | Where-Object { $_.Name -like '*electron*' } | Select-Object -ExpandProperty Value -First 1
if ($cmd) {
  Write-Host "Registry command: $cmd"
  Start-Process $cmd
  Start-Sleep 5
  $app2 = @(Get-Process -Name '日历清单' -ErrorAction SilentlyContinue)
  if ($app2) { Write-Host "Auto-start simulation: OK ($($app2.Count) pids)" }
  else { Write-Host "Auto-start simulation: FAIL" }
} else {
  Write-Host 'No registry entry!'
}

$psAfter = @(Get-Process -Name powershell -ErrorAction SilentlyContinue).Count
Write-Host "PowerShell after: $psAfter (delta: $($psAfter-$psBefore))"
