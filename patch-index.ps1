param(
  [string]$IndexPath = ".\index.html"
)

if (!(Test-Path $IndexPath)) {
  Write-Host "index.html が見つからない: $IndexPath"
  exit 1
}

$dir = Split-Path -Parent (Resolve-Path $IndexPath)
Copy-Item "$PSScriptRoot\mobile-audio-ui-fix.js" "$dir\mobile-audio-ui-fix.js" -Force
Copy-Item "$PSScriptRoot\mobile-ui-fix.css" "$dir\mobile-ui-fix.css" -Force

$html = Get-Content $IndexPath -Raw -Encoding UTF8
if ($html -notmatch 'mobile-ui-fix\.css') {
  $html = $html -replace '</head>', '  <link rel="stylesheet" href="mobile-ui-fix.css">`r`n</head>'
}
if ($html -notmatch 'mobile-audio-ui-fix\.js') {
  $html = $html -replace '</body>', '  <script src="mobile-audio-ui-fix.js"></script>`r`n</body>'
}
Set-Content $IndexPath $html -Encoding UTF8
Write-Host "修正完了: $IndexPath"
