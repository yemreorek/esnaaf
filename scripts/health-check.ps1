# Esnaaf Platform Health Check Script (Windows)
# Task Scheduler ile 5 dakikada bir çalıştırılabilir

$ApiUrl = "https://esnaaf-backend-339090537138.europe-west3.run.app/api/health"
$FrontendUrls = @(
    "https://esnaaf.com",
    "https://partner.esnaaf.com"
)
$LogFile = "$PSScriptRoot\health-check.log"
$Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$results = @()

# Backend Health
try {
    $r = Invoke-WebRequest -Uri $ApiUrl -UseBasicParsing -TimeoutSec 10
    $data = $r.Content | ConvertFrom-Json
    if ($data.status -eq 'UP') {
        $results += "[$Timestamp] OK: Backend API healthy (DB:$($data.database), Redis:$($data.redis))"
    } else {
        $results += "[$Timestamp] WARN: Backend partial — DB:$($data.database), Redis:$($data.redis)"
    }
} catch {
    $results += "[$Timestamp] CRITICAL: Backend API unreachable — $($_.Exception.Message)"
}

# Frontend Health
foreach ($url in $FrontendUrls) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        $results += "[$Timestamp] OK: $url => $($r.StatusCode)"
    } catch {
        $results += "[$Timestamp] CRITICAL: $url => $($_.Exception.Message)"
    }
}

# Log
$results | Out-File -Append -FilePath $LogFile -Encoding UTF8
$results | ForEach-Object { Write-Output $_ }
