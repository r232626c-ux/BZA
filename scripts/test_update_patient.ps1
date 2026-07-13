param(
  [string]$Query = "John Doe",
  [string]$TokenEnvVar = "API_TOKEN"
)

$API = "http://127.0.0.1:8000"
$token = $env:$TokenEnvVar
if (-not $token) {
  Write-Error "Set environment variable $TokenEnvVar with a valid JWT token"
  exit 1
}

# 1) Search patient
$escaped = [System.Uri]::EscapeDataString($Query)
$patients = Invoke-RestMethod -Uri "$API/patients/search/?query=$escaped" -Headers @{Authorization="Bearer $token"} -Method GET
if (-not $patients -or $patients.Count -eq 0) {
  Write-Host "No patient found for query: $Query"
  exit 0
}
$patient = $patients[0]
Write-Host "Found patient id=$($patient.id) name=$($patient.first_name) $($patient.last_name)"

# 2) Update patient (append a digit to phone for test)
$body = @{
  first_name = $patient.first_name
  last_name  = $patient.last_name
  dob        = $patient.dob
  phone      = $patient.phone
  email      = $patient.email
  address    = $patient.address
  funding    = $patient.funding
}

$body.phone = ($body.phone -replace '\D','') + '1'

Invoke-RestMethod -Uri "$API/patients/$($patient.id)" -Headers @{Authorization="Bearer $token"; 'Content-Type'='application/json'} -Method PUT -Body (ConvertTo-Json $body)

Write-Host "Updated patient id=$($patient.id)"
