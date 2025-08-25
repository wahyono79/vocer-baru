@echo off
echo 🚀 WiFi Voucher Management - Vercel Deployment
echo ===============================================

echo.
echo 📦 Building production version...
call npm run build

echo.
echo ✅ Build completed! Your app is ready for Vercel deployment.
echo.
echo 📋 Next Steps:
echo.
echo 🌐 Method 1 - Vercel Dashboard (Recommended):
echo   1. Go to vercel.com
echo   2. Sign up/Login with GitHub
echo   3. Click "New Project"
echo   4. Import your GitHub repository
echo   5. Deploy (auto-configured)
echo.
echo 💻 Method 2 - Vercel CLI:
echo   1. npm install -g vercel
echo   2. vercel login
echo   3. vercel (from this directory)
echo   4. Follow the prompts
echo.
echo 📊 Your app features:
echo   ✅ PWA (installable)
echo   ✅ Offline mode
echo   ✅ Auto-sync every 5 seconds
echo   ✅ Mobile-responsive
echo   ✅ Fast loading (Vite optimized)
echo.
echo 📁 Files created for Vercel:
echo   ✅ vercel.json (deployment config)
echo   ✅ .vercelignore (optimized bundle)
echo   ✅ env.example (environment guide)
echo   ✅ VERCEL_DEPLOYMENT_GUIDE.md (complete guide)
echo.
echo 🎯 After deployment, your app will be available at:
echo   https://your-app-name.vercel.app
echo.
pause