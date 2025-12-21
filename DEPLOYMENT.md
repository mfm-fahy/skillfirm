# Deployment Guide

## Backend Deployment (Render)

### Step 1: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: skillfarm-backend
   - **Region**: Oregon (US West)
   - **Branch**: main (or your default branch)
   - **Root Directory**: Leave empty
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

### Step 2: Add Environment Variables
In Render dashboard, add these environment variables:
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `MONGODB_URI` = `mongodb+srv://mfmfahy_db_user:TCrTv206vczwllMe@cluster0.ho2unvn.mongodb.net/?appName=Cluster0`
- `JWT_SECRET` = `skillfarm_jwt_secret_2024_secure_key`
- `OPENROUTER_API_KEY` = `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`
- `YOUTUBE_API_KEY` = `AIzaSyCMnBTkHH2w5Xl0x1iV0jcrTQqOdDyaE3c`
- `NEWS_API_KEY` = `3ff661565b794f5da7be93cd7573beff`
- `FRONTEND_URL` = (Add after deploying frontend - see Step 5)

### Step 3: Deploy
Click "Create Web Service" and wait for deployment to complete.

### Step 4: Copy Backend URL
After deployment, copy your backend URL (e.g., `https://skillfarm-backend.onrender.com`)

---

## Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default
   - **Install Command**: `npm install`

### Step 2: Add Environment Variables
In Vercel project settings → Environment Variables, add:
- `NEXT_PUBLIC_API_URL` = `https://your-backend-url.onrender.com` (from Step 4 above)
- `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-url.onrender.com` (same as above)

### Step 3: Deploy
Click "Deploy" and wait for deployment to complete.

### Step 4: Copy Frontend URL
After deployment, copy your frontend URL (e.g., `https://your-app.vercel.app`)

### Step 5: Update Backend CORS
Go back to Render dashboard and update the `FRONTEND_URL` environment variable with your Vercel URL from Step 4.
Then redeploy the backend service.

---

## Quick Setup Commands

### Update Local Environment Files

**Client (.env):**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.onrender.com
```

**Server (.env.production):**
```bash
FRONTEND_URL=https://your-app.vercel.app
```

---

## Testing Deployment

### Test Backend
```bash
curl https://your-backend-url.onrender.com/health
```
Expected response: `{"status":"OK","environment":"production"}`

### Test Frontend
Visit your Vercel URL in a browser and verify:
- Pages load correctly
- API calls work
- Socket.IO connections establish
- Authentication works

---

## Important Notes

1. **First Deploy**: Render free tier may take 1-2 minutes to spin up after inactivity
2. **CORS**: Backend is configured to accept requests from your Vercel domain
3. **WebSockets**: Socket.IO is configured for production with proper CORS
4. **Environment Variables**: Never commit `.env` files to Git
5. **MongoDB**: Using MongoDB Atlas (already configured)
6. **SSL**: Both Render and Vercel provide free SSL certificates

---

## Troubleshooting

### Backend Issues
- Check Render logs in dashboard
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### Frontend Issues
- Check Vercel deployment logs
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors

### CORS Issues
- Verify `FRONTEND_URL` in backend matches your Vercel URL
- Ensure no trailing slashes in URLs
- Redeploy backend after updating CORS settings

---

## Post-Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured on both platforms
- [ ] Backend `FRONTEND_URL` updated with Vercel URL
- [ ] Backend redeployed after CORS update
- [ ] Health check endpoint working
- [ ] Frontend can connect to backend
- [ ] Socket.IO connections working
- [ ] Authentication flow working
- [ ] All API endpoints responding correctly
