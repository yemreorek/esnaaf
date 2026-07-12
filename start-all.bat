@echo off
echo ========================================================
echo        ESNAAF SISTEM BASLATICISI
echo ========================================================
echo.
echo Bu script veritabanini, arka ucu (backend) ve arayuzleri 
echo (frontend) otomatik olarak ayri pencerelerde baslatir.
echo Lutfen acilan pencereleri KAPATMAYINIZ.
echo.

set BASE_DIR=%~dp0
set NODE_PATH=%BASE_DIR%node-portable\node-v22.12.0-win-x64

echo [1/5] PostgreSQL Veritabani baslatiliyor...
start "PostgreSQL" cmd /c "cd /d %BASE_DIR%pg-portable\pgsql\bin && postgres.exe -D "..\data""
timeout /t 2 /nobreak >nul

echo [2/5] Redis Sunucusu baslatiliyor...
start "Redis" cmd /c "cd /d %BASE_DIR%redis-portable && redis-server.exe redis.windows.conf"
timeout /t 2 /nobreak >nul

echo [3/5] Backend API baslatiliyor...
start "Backend API" cmd /c "set PATH=%NODE_PATH%;%PATH% && cd /d %BASE_DIR%backend-api && npm run start:dev"
timeout /t 2 /nobreak >nul

echo [4/5] Admin Paneli (app-hizmetveren) baslatiliyor...
start "Admin Paneli" cmd /c "set PATH=%NODE_PATH%;%PATH% && cd /d %BASE_DIR%app-hizmetveren && npm run dev"
timeout /t 2 /nobreak >nul

echo [5/5] Musteri Paneli (app-musteri) baslatiliyor...
start "Musteri Paneli" cmd /c "set PATH=%NODE_PATH%;%PATH% && cd /d %BASE_DIR%app-musteri && npm run dev"

echo.
echo ========================================================
echo TUM SISTEMLER BASARIYLA BASLATILDI!
echo ========================================================
echo Frontend: http://localhost:3001 (Admin)
echo Frontend: http://localhost:3000 (Musteri)
echo Backend API: http://localhost:3005
echo.
pause
