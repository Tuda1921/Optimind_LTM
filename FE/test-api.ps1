# Test API Script - Optimind Backend

$baseUrl = "http://localhost:3000"

Write-Host "`n=== 1. TEST SIGNUP ===" -ForegroundColor Cyan
$signup = Invoke-WebRequest -Uri "$baseUrl/api/auth/signup" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"password123","name":"Test User"}' `
  -UseBasicParsing

Write-Host "Status: $($signup.StatusCode)"
Write-Host "Response: $($signup.Content)`n"

Write-Host "`n=== 2. TEST LOGIN ===" -ForegroundColor Cyan
$login = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -UseBasicParsing `
  -SessionVariable session

Write-Host "Status: $($login.StatusCode)"
Write-Host "Response: $($login.Content)"
Write-Host "Cookies: $($session.Cookies.GetCookies($baseUrl))`n"

Write-Host "`n=== 3. TEST GET USER ===" -ForegroundColor Cyan
$me = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
  -Method GET `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($me.StatusCode)"
Write-Host "Response: $($me.Content)`n"

Write-Host "`n=== 4. TEST CREATE TASK ===" -ForegroundColor Cyan
$task = Invoke-WebRequest -Uri "$baseUrl/api/tasks" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"title":"Complete homework","description":"Math chapter 5","priority":"high","status":"todo"}' `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($task.StatusCode)"
Write-Host "Response: $($task.Content)`n"

Write-Host "`n=== 5. TEST GET TASKS ===" -ForegroundColor Cyan
$tasks = Invoke-WebRequest -Uri "$baseUrl/api/tasks" `
  -Method GET `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($tasks.StatusCode)"
Write-Host "Response: $($tasks.Content)`n"

Write-Host "`n=== 6. TEST START STUDY SESSION ===" -ForegroundColor Cyan
$startSession = Invoke-WebRequest -Uri "$baseUrl/api/sessions" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"taskId":null}' `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($startSession.StatusCode)"
$sessionData = $startSession.Content | ConvertFrom-Json
$sessionId = $sessionData.session.id
Write-Host "Response: $($startSession.Content)`n"

Write-Host "`n=== 7. TEST LOG FOCUS ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2
$focusLog = Invoke-WebRequest -Uri "$baseUrl/api/sessions/$sessionId/focus-log" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"score":85,"timestamp":"'+(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")+'"}' `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($focusLog.StatusCode)"
Write-Host "Response: $($focusLog.Content)`n"

Write-Host "`n=== 8. TEST END SESSION ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2
$endSession = Invoke-WebRequest -Uri "$baseUrl/api/sessions/$sessionId/end" `
  -Method PUT `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($endSession.StatusCode)"
Write-Host "Response: $($endSession.Content)`n"

Write-Host "`n=== 9. TEST GET ANALYTICS ===" -ForegroundColor Cyan
$analytics = Invoke-WebRequest -Uri "$baseUrl/api/sessions/analytics?period=week" `
  -Method GET `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($analytics.StatusCode)"
Write-Host "Response: $($analytics.Content)`n"

Write-Host "`n=== 10. TEST GET PET ===" -ForegroundColor Cyan
$pet = Invoke-WebRequest -Uri "$baseUrl/api/gamification/pet" `
  -Method GET `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($pet.StatusCode)"
Write-Host "Response: $($pet.Content)`n"

Write-Host "`n=== 11. TEST SHOP ===" -ForegroundColor Cyan
$shop = Invoke-WebRequest -Uri "$baseUrl/api/gamification/shop" `
  -Method GET `
  -WebSession $session `
  -UseBasicParsing

Write-Host "Status: $($shop.StatusCode)"
Write-Host "Response: $($shop.Content)`n"

Write-Host "`n=== ✅ ALL TESTS COMPLETED ===" -ForegroundColor Green
