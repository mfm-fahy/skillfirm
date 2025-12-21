# SkillFarm V9 Deployment Instructions

## Overview
This project is configured for deployment with:
- **Frontend**: Vercel (Next.js)
- **Backend**: Render (Node.js/Express)
- **Database**: MongoDB Atlas

## Backend Deployment (Render)

### 1. Create Render Account
- Go to [render.com](https://render.com) and sign up
- Connect your GitHub repository

### 2. Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `skillfarm-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Set Environment Variables
Add these environment variables in Render dashboard:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://mfmfahy_db_user:TCrTv206vczwllMe@cluster0.ho2unvn.mongodb.net/?appName=Cluster0
JWT_SECRET=skillfarm_jwt_secret_2024_secure_key
OPENROUTER_API_KEY=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
YOUTUBE_API_KEY=AIzaSyCMnBTkHH2w5Xl0x1iV0jcrTQqOdDyaE3c
NEWS_API_KEY=3ff661565b794f5da7be93cd7573beff
FRONTEND_URL=https://skillfarm-v9.vercel.app
```

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Your backend will be available at: `https://skillfarm-backend.onrender.com`

## Frontend Deployment (Vercel)

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com) and sign up
- Install Vercel CLI: `npm i -g vercel`

### 2. Deploy Frontend
1. Connect your GitHub repository to Vercel
2. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Set Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://skillfarm-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://skillfarm-backend.onrender.com
```

### 4. Deploy
- Push to main branch or click "Deploy" in Vercel dashboard
- Your frontend will be available at: `https://skillfarm-v9.vercel.app`

## Post-Deployment Steps

### 1. Update CORS Settings
Ensure your backend allows requests from your Vercel domain. The configuration is already set in `server/server.js`.

### 2. Test the Connection
1. Visit your frontend URL
2. Check browser console for any CORS errors
3. Test API endpoints and real-time features

### 3. Monitor Logs
- **Render**: Check function logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard

## Environment Variables Summary

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://skillfarm-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://skillfarm-backend.onrender.com
```

### Backend (.env.production)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://mfmfahy_db_user:TCrTv206vczwllMe@cluster0.ho2unvn.mongodb.net/?appName=Cluster0
JWT_SECRET=skillfarm_jwt_secret_2024_secure_key
OPENROUTER_API_KEY=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
YOUTUBE_API_KEY=AIzaSyCMnBTkHH2w5Xl0x1iV0jcrTQqOdDyaE3c
NEWS_API_KEY=3ff661565b794f5da7be93cd7573beff
FRONTEND_URL=https://skillfarm-v9.vercel.app
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure FRONTEND_URL is set correctly in backend
   - Check allowed origins in server.js

2. **API Connection Issues**
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check if backend is running on Render

3. **Socket.IO Connection Issues**
   - Ensure NEXT_PUBLIC_SOCKET_URL matches backend URL
   - Check WebSocket support on hosting platforms

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

### Health Checks
- Backend health: `https://skillfarm-backend.onrender.com/health`
- Frontend: Check if pages load correctly

## Security Notes
- All sensitive environment variables are configured
- CORS is properly configured for production
- JWT secrets are secure
- Database connection uses authentication

## Performance Optimization
- Render free tier may have cold starts
- Consider upgrading to paid plans for better performance
- Monitor usage and optimize as needed