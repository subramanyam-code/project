# Netlify Deployment Guide for TSPM Frontend

## Prerequisites

Before deploying to Netlify, you need to:
1. Fix all TypeScript build errors
2. Have a GitHub/GitLab/Bitbucket account
3. Push your code to a Git repository
4. Have a Netlify account (free tier works fine)

## Step 1: Fix Build Errors

The build is currently failing. Run this command to see the errors:
```bash
cd frontend
npm run build
```

**Common fixes needed:**
- Export missing `apiService` and `useRBAC` 
- Fix type mismatches (IDs as strings vs numbers)
- Add missing component props
- Fix import paths

## Step 2: Configure Environment Variables

Create a `.env.production` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
NEXT_PUBLIC_APP_NAME=TSPM
```

**Important:** Replace `https://your-backend-api.com` with your actual backend URL. Options:
- Deploy backend to Render/Railway/Fly.io first
- Use ngrok/localtunnel for testing (temporary)
- Deploy backend to a cloud provider

## Step 3: Prepare for Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. **Push to Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Build Settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/.next`
   - **Node version:** 18 or higher

4. **Add Environment Variables:**
   Go to Site settings → Environment variables and add:
   - `NEXT_PUBLIC_API_URL`: Your backend API URL
   - `NEXT_PUBLIC_APP_NAME`: TSPM

5. **Deploy:**
   Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# From the frontend directory
cd frontend

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

## Step 4: Configure netlify.toml

Create `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

## Step 5: Backend Deployment

Your frontend needs a backend. Options:

### Option 1: Deploy to Render (Free tier available)
```bash
# In project root
# Render will auto-detect your Dockerfile
```

### Option 2: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 3: Deploy to Fly.io
```bash
# Install Fly CLI
# Deploy
fly launch
fly deploy
```

## Step 6: Update API URL

After deploying the backend, update the environment variable in Netlify:
1. Go to Site settings → Environment variables
2. Update `NEXT_PUBLIC_API_URL` with your actual backend URL
3. Trigger a new deployment

## Common Issues & Solutions

### Build fails with TypeScript errors
- Run `npm run build` locally first
- Fix all type errors before deploying
- Check the build logs in Netlify

### Environment variables not working
- Ensure they start with `NEXT_PUBLIC_`
- Redeploy after adding variables
- Check they're set in Netlify dashboard

### API calls failing (CORS errors)
- Configure CORS in your FastAPI backend
- Add your Netlify domain to allowed origins
- Check network tab in browser DevTools

### 404 on page refresh
- Ensure `netlify.toml` has the redirect rule
- Check Next.js is in static export mode if using `output: 'export'`

## Step 7: Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS according to Netlify's instructions
4. Enable HTTPS (automatic with Netlify)

## Testing the Deployment

After deployment:
1. Visit your Netlify URL (e.g., `your-site-name.netlify.app`)
2. Test login functionality
3. Check API calls in Network tab
4. Test on different devices/browsers

## Continuous Deployment

Netlify automatically deploys when you push to your Git repository:
```bash
git add .
git commit -m "Update feature"
git push
# Netlify automatically builds and deploys
```

## Important Notes

⚠️ **Before deploying:**
- The build MUST succeed locally (`npm run build`)
- Backend must be deployed and accessible
- Environment variables must be set
- CORS must be configured in backend

✅ **After deploying:**
- Test all features thoroughly
- Monitor build logs for errors
- Check API connectivity
- Set up custom domain if needed
