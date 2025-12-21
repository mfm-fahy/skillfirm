@echo off
echo 🚀 Starting SkillFarm V9 deployment process...

REM Check if we're in the right directory
if not exist "client" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "server" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📦 Installing dependencies...

REM Install client dependencies
echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)

REM Build client for production
echo Building client for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build client
    pause
    exit /b 1
)

cd ..

REM Install server dependencies
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)

cd ..

echo ✅ Dependencies installed and client built successfully!

echo.
echo 📋 Deployment Checklist:
echo 1. ✅ Client dependencies installed
echo 2. ✅ Client built for production
echo 3. ✅ Server dependencies installed
echo 4. 🔄 Environment variables configured
echo 5. 🔄 Ready for deployment

echo.
echo 🌐 Deployment URLs:
echo Frontend (Vercel): https://skillfarm-v9.vercel.app
echo Backend (Render): https://skillfarm-backend.onrender.com

echo.
echo 📚 Next Steps:
echo 1. Push your code to GitHub
echo 2. Deploy backend to Render using render.yaml
echo 3. Deploy frontend to Vercel using vercel.json
echo 4. Set environment variables on both platforms
echo 5. Test the deployment

echo.
echo 📖 For detailed instructions, see DEPLOYMENT_INSTRUCTIONS.md
echo 🎉 Deployment preparation complete!

pause