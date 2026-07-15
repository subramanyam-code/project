# Quick Start: Deploy to Netlify

## ⚡ 5-Minute Deployment Guide

### Step 1: Test Build (2 mins)
```powershell
cd frontend
npm run build
```

If it fails, I've fixed the main issues. Try again!

### Step 2: Push to GitHub (2 mins)
```bash
# In project root
git init
git add .
git commit -m "Ready for deployment"

# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Netlify (1 min)

1. **Go to** https://app.netlify.com
2. **Click** "Add new site" → "Import an existing project"
3. **Choose** GitHub and select your repository
4. **Configure:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
   
5. **Add Environment Variable:**
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `http://localhost:8000/api/v1` (temporary, change later)

6. **Click** "Deploy site"

### Step 4: Access Your Site

Your site will be live at: `https://random-name-12345.netlify.app`

## ⚠️ Important: Backend Required!

Your frontend needs a backend to work properly. You have 3 options:

### Option A: Deploy Backend to Render (Recommended - Free)
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your repo, select backend folder
4. It will auto-detect Dockerfile
5. Deploy and get your URL like: `https://your-app.onrender.com`
6. Update Netlify env var `NEXT_PUBLIC_API_URL` to this URL
7. Redeploy Netlify

### Option B: Use Ngrok (Quick Testing Only)
```bash
# In backend directory
uvicorn app.main:app --reload

# In another terminal
ngrok http 8000
```
Use the ngrok URL as `NEXT_PUBLIC_API_URL`

### Option C: Deploy to Railway
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

## 🔧 Configure CORS

In `backend/app/core/config.py`, add your Netlify URL:

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-site-name.netlify.app"  # Add your actual Netlify URL
]
```

Then redeploy your backend!

## ✅ Verify Deployment

1. Visit your Netlify URL
2. Open browser DevTools (F12)
3. Try to login
4. Check Console for errors
5. Check Network tab for API calls

## 🎉 Share With Your Team!

Once everything works, share your Netlify URL:
```
https://your-site-name.netlify.app
```

## 📚 Need More Help?

- **Detailed guide:** See `NETLIFY_DEPLOYMENT_GUIDE.md`
- **Checklist:** See `DEPLOYMENT_CHECKLIST.md`
- **Build issues:** Run `frontend/test-build.ps1`

## 🚨 Common Issues

**Build fails:** 
- Run `npm run build` locally first
- Check error messages
- Ensure all dependencies are in package.json

**Can't login:**
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Ensure backend is running and accessible
- Check CORS configuration

**404 errors:**
- Ensure `netlify.toml` exists in frontend folder
- Check redirect rules

## 💡 Pro Tips

1. **Custom domain:** Add in Netlify → Domain settings
2. **Auto-deploy:** Every git push auto-deploys!
3. **Preview deploys:** Pull requests get preview URLs
4. **Rollback:** Easy rollback in Netlify dashboard

---

**Need help?** Open an issue or check the detailed guides!
