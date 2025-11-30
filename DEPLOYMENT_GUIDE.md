# Brainy Flavors Accounting - Vercel Deployment Guide

## 📋 What We're Deploying

- **Frontend (Next.js)** → Vercel ✅
- **Backend (Express API)** → Railway (Free) ✅  
- **Database** → PostgreSQL on Railway ✅

---

## 🚀 Step-by-Step Deployment Instructions

### PART 1: Deploy Backend to Railway (5 minutes)

#### 1. Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Click "Login" → Sign in with GitHub
3. Authorize Railway to access your repositories

#### 2. Create New Project
1. Click "**New Project**"
2. Select "**Deploy from GitHub repo**"
3. If this is your first time, connect your GitHub account
4. Search for and select your repository: `Brainy Flavors/Accounting`

#### 3. Configure Backend Service
1. Railway will detect your project structure
2. Click "**Add Service**" → "**GitHub Repo**"
3. In the service settings:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`  
   - **Watch Paths**: `/backend/**`

#### 4. Add PostgreSQL Database
1. Click "**+ New**" in your project
2. Select "**Database**" → "**Add PostgreSQL**"
3. Railway will automatically create the database
4. The `DATABASE_URL` will be automatically injected

#### 5. Add Environment Variables
1. Click on your backend service
2. Go to "**Variables**" tab
3. Click "**+ New Variable**" and add:

```
NODE_ENV=production
JWT_SECRET=<generate-random-string-here>
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=<we'll add this after deploying frontend>
```

**To generate JWT_SECRET**, run in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 6. Deploy Backend
1. Railway will automatically deploy
2. Wait for deployment to complete (2-3 minutes)
3. Once deployed, click "**Settings**" → "**Networking**"
4. Click "**Generate Domain**"
5. **IMPORTANT**: Copy your Railway backend URL (e.g., `https://brainy-accounting-production.up.railway.app`)
6. Save this URL - you'll need it for the frontend!

---

### PART 2: Deploy Frontend to Vercel (3 minutes)

#### 1. Install Vercel CLI (Optional but recommended)
```bash
npm install -g vercel
```

#### 2. Prepare Frontend
1. Update `frontend/.env.production` with your Railway backend URL:
```env
NEXT_PUBLIC_API_URL=https://brainy-accounting-production.up.railway.app/api
```

#### 3. Deploy to Vercel via Website

**Option A: Deploy via Vercel Website (Easier)**

1. Go to [Vercel.com](https://vercel.com)
2. Click "**Add New...**" → "**Project**"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "**Environment Variables**"
6. Add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-railway-backend-url.up.railway.app/api`
7. Click "**Deploy**"

**Option B: Deploy via CLI (Faster)**

```bash
cd "d:\Brainy Flavors\Accounting\frontend"
vercel
```

Follow prompts:
- Link to existing project? **No**
- Project name: **brainy-accounting** (or your choice)
- In which directory? **./frontend**
- Override settings? **No**

Then add environment variable:
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Paste your Railway backend URL when prompted
```

Redeploy to apply env variables:
```bash
vercel --prod
```

#### 4. Get Your Frontend URL
1. After deployment, Vercel will give you a URL like:
   - `https://brainy-accounting.vercel.app`
2. **Copy this URL**

---

### PART 3: Update CORS & Final Configuration

#### 1. Update Backend CORS
1. Go back to Railway
2. Click your backend service → "**Variables**"
3. Add/Update:
   - **FRONTEND_URL**: `https://brainy-accounting.vercel.app`

#### 2. Update CORS in Code
Add your Vercel URL to the backend CORS configuration.

You need to update `backend/src/index.ts` to include your Vercel URL in the CORS origins.

#### 3. Redeploy Backend
Railway will automatically redeploy when you push changes to GitHub.

---

## ✅ Verification Checklist

Test your deployment:

- [ ] Visit your Vercel frontend URL
- [ ] Try to log in
- [ ] Create a test invoice
- [ ] Check if data persists
- [ ] Test all major features

---

## 🔧 Post-Deployment Tasks

### 1. Run Database Migrations
In Railway dashboard:
1. Click backend service → "**Settings**"
2. Under "**Deploy**", the migrations should run automatically
3. If not, you can run manually via Railway CLI or add to build command

### 2. Seed Initial Data
If you need to seed accounts, roles, etc., you can:
1. Create a seed script in `backend/prisma/seed.ts`
2. Run it via Railway's CLI or add to your deployment script

### 3. Set Up Custom Domain (Optional)
**For Frontend (Vercel):**
1. Go to Vercel project → "Settings" → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

**For Backend (Railway):**
1. Go to Railway project → Backend service → "Settings" → "Networking"
2. Add custom domain
3. Configure DNS records

---

## 🐛 Troubleshooting

### Issue: Backend won't start
**Solution**: Check Railway logs
1. Go to backend service → "Deployments"
2. Click latest deployment → "View Logs"
3. Look for errors

Common fixes:
- Ensure `DATABASE_URL` is set
- Check if `npm start` script exists in package.json
- Verify build completed successfully

### Issue: Frontend can't connect to backend
**Solution**: Check CORS and API URL
1. Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. Check backend CORS allows your frontend URL
3. Make sure backend is running (check Railway)

### Issue: Database connection error
**Solution**: 
1. Ensure PostgreSQL database is running in Railway
2. Check `DATABASE_URL` format is correct
3. Run migrations: `npx prisma migrate deploy`

---

## 📊 Monitoring & Logs

### View Backend Logs (Railway)
1. Go to Railway → Your Project → Backend Service
2. Click "**Deployments**" → Latest deployment
3. View logs in real-time

### View Frontend Logs (Vercel)
1. Go to Vercel → Your Project
2. Click "**Deployments**" → Latest deployment  
3. Click "**View Function Logs**"

---

## 💰 Cost Estimate

- **Railway**: 
  - PostgreSQL: $5/month (500 hours free trial)
  - Backend hosting: Free tier (500 hours/month)
  
- **Vercel**: 
  - Frontend: Free for personal projects
  - Bandwidth: Generous free tier

**Total**: ~$5/month (or free during trial period)

---

## 🎉 Success!

Your app should now be live at:
- **Frontend**: `https://brainy-accounting.vercel.app`
- **Backend API**: `https://your-app.up.railway.app`

**Next Steps**:
1. Test thoroughly
2. Set up monitoring
3. Configure backups
4. Add custom domain
5. Share with your team!

---

## 📞 Need Help?

If you run into issues:
1. Check the troubleshooting section above
2. Review Railway and Vercel logs
3. Verify all environment variables are set correctly
4. Let me know what error you're seeing!
