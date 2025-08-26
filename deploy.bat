@echo off
echo.
echo =====================================
echo   WiFi Voucher Management Deployment
echo =====================================
echo.

echo [1/3] Building production version...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Build completed successfully!
echo.
echo [3/3] Choose deployment option:
echo.
echo 1. Deploy to Vercel (Recommended - FREE)
echo 2. Deploy to Netlify (Alternative - FREE)
echo 3. Show manual deployment options
echo 4. Exit
echo.

set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo.
    echo Deploying to Vercel...
    echo Note: You'll need to login to Vercel if first time
    echo.
    call vercel --prod
    echo.
    echo Deployment completed! Your app is now live.
    pause
) else if "%choice%"=="2" (
    echo.
    echo To deploy to Netlify:
    echo 1. Go to https://netlify.com
    echo 2. Drag and drop the 'dist' folder to Netlify
    echo 3. Get your instant URL!
    echo.
    echo Or install Netlify CLI: npm install -g netlify-cli
    echo Then run: netlify deploy --prod --dir=dist
    echo.
    pause
) else if "%choice%"=="3" (
    echo.
    echo Manual Deployment Options:
    echo.
    echo 1. GitHub Pages - Push to GitHub and enable Pages
    echo 2. Firebase - Run: firebase deploy
    echo 3. Surge.sh - cd dist ^&^& surge
    echo 4. Any static hosting - Upload 'dist' folder contents
    echo.
    echo Your built files are in the 'dist' folder.
    echo.
    pause
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo =====================================
echo   Deployment process completed!
echo =====================================
pause