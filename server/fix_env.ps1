$envPath = ".env"
if (Test-Path $envPath) {
    $content = Get-Content $envPath
    $dbUrlLine = $content | Where-Object { $_ -match "^DATABASE_URL=" }
    if ($dbUrlLine) {
        $directUrlLine = $dbUrlLine -replace "^DATABASE_URL=", "DIRECT_URL="
        Add-Content $envPath "`n$directUrlLine"
        Write-Host "Added DIRECT_URL to .env"
    } else {
        Write-Host "DATABASE_URL not found in .env"
    }
} else {
    Write-Host ".env file not found"
}
