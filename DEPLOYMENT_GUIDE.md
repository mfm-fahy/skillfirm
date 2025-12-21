# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (connected to GitHub)
- Render account (connected to GitHub)
- MongoDB Atlas database
- API keys for external services

## Backend Deployment (Render)

### 1. Environment Variables Setup
Set these environment variables in your Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
YOUTUBE_API_KEY=your_youtube_api_key
NEWS_API_KEY=your_news_api_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2. Deploy to Render
1. Push your code to GitHub
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Use the `render.yaml` configuration or manual setup:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Region**: Oregon (or your preferred region)

### 3. Get Backend URL
After deployment, note your backend URL (e.g., `https://skillfarm-backend.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Update Environment Variables
Update the frontend environment variables with your actual backend URL:

In `client/.env.production`:
```
NEXT_PUBLIC_API_URL=https://your-actual-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-actual-backend.onrender.com
```

### 2. Deploy to Vercel
1. Push your updated code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect the Next.js project
4. Set the **Root Directory** to `client`
5. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL
   - `NEXT_PUBLIC_SOCKET_URL`: Your Render backend URL

### 3. Update Backend with Frontend URL
After Vercel deployment, update the `FRONTEND_URL` environment variable in Render with your actual Vercel domain.

## Post-Deployment Steps

### 1. Update CORS Configuration
In `server/server.js`, replace the placeholder domain:
```javascript
'https://skillfarm-v9.vercel.app' // Replace with your actual Vercel domain
```

### 2. Test the Deployment
1. Visit your Vercel frontend URL
2. Test API connectivity
3. Test real-time features (Socket.IO)
4. Verify all environment variables are working

### 3. Domain Configuration (Optional)
- Configure custom domain in Vercel
- Update CORS settings if using custom domain
- Update environment variables accordingly

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure frontend URL is correctly set in backend environment variables
2. **API Connection**: Verify `NEXT_PUBLIC_API_URL` matches your Render backend URL
3. **Socket.IO Issues**: Check `NEXT_PUBLIC_SOCKET_URL` configuration
4. **Build Failures**: Ensure all dependencies are in `package.json`

### Logs:
- **Render**: Check deployment logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **MongoDB**: Verify connection string and network access

## Environment Variables Checklist

### Backend (Render):
- [ ] NODE_ENV=production
- [ ] PORT=10000
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] OPENROUTER_API_KEY
- [ ] YOUTUBE_API_KEY
- [ ] NEWS_API_KEY
- [ ] FRONTEND_URL

### Frontend (Vercel):
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_SOCKET_URL

## Security Notes
- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Regularly rotate API keys
- Enable MongoDB IP whitelist for production
- Use HTTPS for all communications