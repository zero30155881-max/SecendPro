# PowerShell script to run the project
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "`nSetting up database (if needed)..." -ForegroundColor Green
npm run setup-db

Write-Host "`nStarting development server..." -ForegroundColor Green
Write-Host "The application will be available at: http://localhost:3000" -ForegroundColor Yellow
npm run dev
