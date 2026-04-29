$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$binDir = Join-Path $PSScriptRoot "bin"
if (!(Test-Path $binDir)) {
  New-Item -ItemType Directory -Path $binDir | Out-Null
}

g++ "$PSScriptRoot\cpp\auth_engine.cpp" "$root\VerificationEngine.cpp" "$root\Wallet.cpp" "$root\Booking.cpp" -std=c++17 -o "$binDir\auth_engine.exe"
Write-Host "Built backend/bin/auth_engine.exe"
