#!/bin/bash

# SkillFarm V9 Deployment Script
echo "🚀 Starting SkillFarm V9 deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "client" ] && [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi

# Build client for production
echo "Building client for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

cd ..

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi

cd ..

echo "✅ Dependencies installed and client built successfully!"

echo "📋 Deployment Checklist:"
echo "1. ✅ Client dependencies installed"
echo "2. ✅ Client built for production"
echo "3. ✅ Server dependencies installed"
echo "4. 🔄 Environment variables configured"
echo "5. 🔄 Ready for deployment"

echo ""
echo "🌐 Deployment URLs:"
echo "Frontend (Vercel): https://skillfarm-v9.vercel.app"
echo "Backend (Render): https://skillfarm-backend.onrender.com"

echo ""
echo "📚 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy backend to Render using render.yaml"
echo "3. Deploy frontend to Vercel using vercel.json"
echo "4. Set environment variables on both platforms"
echo "5. Test the deployment"

echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_INSTRUCTIONS.md"
echo "🎉 Deployment preparation complete!"