@echo off
echo 🔍 Vercel Debug Deployment - WiFi Voucher Management
echo ================================================

echo.
echo 📦 Building debug version...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed! Check for errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful! 
echo.
echo 🚀 Deploying to Vercel...
echo.
echo 📋 What the debug version will show:
echo   ✅ "WiFi Voucher Management - Debug Mode" header
echo   ✅ "App is Loading Successfully!" message  
echo   ✅ Debug information and test button
echo   ✅ Console logs for troubleshooting
echo.
echo 🌐 Your Vercel URL: https://vocer-baru.vercel.app/
echo.
echo 📊 After deployment (2-3 minutes):
echo   1. Open the URL above
echo   2. Press F12 to open DevTools
echo   3. Check Console tab for logs
echo   4. Check Network tab for failed requests
echo.
echo 🎯 If debug app shows:
echo   ✅ SUCCESS: React is working, issue is with complex components
echo   ❌ STILL BLANK: Fundamental Vite/Vercel configuration issue
echo.
echo 📝 Commands to deploy:
echo   git add .
echo   git commit -m "Deploy debug version to fix blank page"
echo   git push
echo.
echo 🔄 Ready to deploy? The files are built and ready.
echo.
pause