@echo off
echo 🚀 WiFi Voucher Management - Android Studio Launcher
echo ================================================

echo.
echo 📱 Building latest web assets...
call npm run build

echo.
echo 🔄 Syncing with Android project...
call npx cap sync android

echo.
echo 📂 Opening Android Studio...
call npx cap open android

echo.
echo ✅ Android Studio should now be opening with your project!
echo.
echo 📋 Next Steps:
echo   1. Wait for Android Studio to load and index the project
echo   2. Connect your Android device or start an emulator
echo   3. Click the green "Run" button to install and run the app
echo   4. Test offline/online functionality
echo.
echo 🎯 Your app features:
echo   ✅ Offline mode with local storage
echo   ✅ Auto-sync every 5 seconds when online
echo   ✅ Visual status indicators
echo   ✅ Mobile-optimized UI
echo   ✅ PDF export functionality
echo   ✅ Push notifications
echo.
pause