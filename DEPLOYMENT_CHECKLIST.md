# Deployment Checklist

## ✅ Pre-Deployment

### 1. Fix Build Errors
```bash
cd frontend
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] All pages render correctly locally

### 2. Test Locally
```bash
npm run dev
```
- [ ] Login works
- [ ] All pages accessible
- [ ] API calls work
- [ ] No console errors

### 3. Prepare Repository
```bash
git status
git add .
git commit -m "Prepare for deployment"
```
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `.gitignore` includes `.env`, `.env.local`

## 🚀 Deployment Steps

### Backend First (Required!)

#### Option A: Render.com
1. [ ] Go to https://render.com
2. [ ] Create new Web Service
3. [ ] Connect your repository
4. [ ] Select backend directory
5. [ ] Use Dockerfile for deployment
6. [ ] Set environment variables from `.env`
7. [ ] Deploy and note the URL

#### Option B: Railway.app  
```bash
cd backend
railway login
railway init
railway up
```
8. [ ] Note the deployed URL

### Frontend Deployment (Netlify)

#### Step 1: Deploy Backend First!
- [ ] Backend is deployed and accessible
- [ ] Backend URL noted (e.g., https://your-app.onrender.com)
- [ ] Backend CORS configured to allow Netlify domain

#### Step 2: Netlify Setup
1. [ ] Go to https://app.netlify.com
2. [ ] Click "Add new site" → "Import an existing project"
3. [ ] Connect Git provider
4. [ ] Select repository

#### Step 3: Configure Build
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/.next
```
5. [ ] Base directory set
6. [ ] Build command set
7. [ ] Publish directory set

#### Step 4: Environment Variables
Add these in Netlify (Site settings → Environment variables):
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
NEXT_PUBLIC_APP_NAME=TSPM
```
8. [ ] Environment variables added
9. [ ] Values are correct

#### Step 5: Deploy
10. [ ] Click "Deploy site"
11. [ ] Wait for build to complete
12. [ ] Note your Netlify URL (e.g., `random-name.netlify.app`)

## 🔧 Post-Deployment

### 1. Update Backend CORS
In your `backend/app/core/config.py`, add your Netlify URL:
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-site.netlify.app"  # Add this
]
```
13. [ ] CORS updated
14. [ ] Backend redeployed

### 2. Test Production Site
15. [ ] Visit your Netlify URL
16. [ ] Test login
17. [ ] Test navigation
18. [ ] Check browser console for errors
19. [ ] Test on mobile device

### 3. Custom Domain (Optional)
20. [ ] Add custom domain in Netlify
21. [ ] Configure DNS
22. [ ] Enable HTTPS

## 📊 Monitoring

### Check Build Logs
- [ ] Review Netlify build logs
- [ ] Check for warnings
- [ ] Monitor deploy times

### Check Runtime
- [ ] Monitor browser console
- [ ] Check Network tab for API calls
- [ ] Test all user flows

## 🐛 Common Issues

### Build Fails
```bash
# Test locally first
cd frontend
npm run build
```
→ Fix all errors before deploying

### API Calls Fail
1. Check NEXT_PUBLIC_API_URL is set
2. Check backend CORS configuration
3. Check backend is running
4. Open browser DevTools → Network tab

### Environment Variables Not Working
1. Ensure they start with `NEXT_PUBLIC_`
2. Redeploy after adding variables
3. Clear browser cache

### 404 on Refresh
1. Check netlify.toml exists
2. Verify redirect rules

## 🔄 Continuous Deployment

After initial setup, deployments are automatic:
```bash
git add .
git commit -m "Update feature"
git push
# Netlify auto-deploys!
```

## 📝 URLs to Save

- [ ] Frontend URL: `_____________________`
- [ ] Backend URL: `_____________________`
- [ ] Git Repository: `_____________________`
- [ ] Netlify Dashboard: `_____________________`

## 🎉 Done!

Your application is now live and accessible to others!

Share your Netlify URL with your team:
`https://your-site.netlify.app`
