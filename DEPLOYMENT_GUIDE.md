# CyberNova Analytics - Deployment Guide

## 📋 Deployment Overview

- **Frontend**: Vercel (Static hosting)
- **Backend**: Render (Python web service)
- **Database**: Neon (Already set up)

---

## 🎯 File Structure for Deployment

### ✅ Your Current Structure is PERFECT!

```
cybernova/
├── Frontend (Vercel deploys these)
│   ├── index.html
│   ├── app.js
│   └── vercel.json
│
├── Backend (Render deploys these)
│   └── backend/
│       ├── app/
│       ├── requirements.txt
│       ├── render.yaml
│       └── .env.example
│
└── Documentation
    ├── README.md
    ├── .gitignore
    └── DEPLOYMENT_GUIDE.md
```

---

## 🚀 Step-by-Step Deployment

### **STEP 1: Push to GitHub**

```bash
git add .
git commit -m "Add deployment configurations for Vercel and Render"
git push origin main
```

---

### **STEP 2: Deploy Backend to Render**

#### A. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

#### B. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

**Basic Settings:**
- **Name**: `cybernova-backend`
- **Region**: Oregon (Free tier)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### C. Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string |
| `SECRET_KEY` | Your JWT secret key |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (update after Vercel deploy) |

#### D. Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. **Copy your backend URL**: `https://cybernova-backend.onrender.com`

---

### **STEP 3: Update Frontend with Backend URL**

1. Open `app.js`
2. Find line 7:
```javascript
: 'https://your-backend-name.onrender.com/api';
```
3. Replace with your actual Render URL:
```javascript
: 'https://cybernova-backend.onrender.com/api';
```
4. Commit and push:
```bash
git add app.js
git commit -m "Update backend URL for production"
git push origin main
```

---

### **STEP 4: Deploy Frontend to Vercel**

#### A. Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

#### B. Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your `cybernova` repository
3. Configure:

**Project Settings:**
- **Framework Preset**: Other
- **Root Directory**: `./` (root)
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)

#### C. Deploy
1. Click **"Deploy"**
2. Wait for deployment (1-2 minutes)
3. **Copy your frontend URL**: `https://cybernova.vercel.app`

---

### **STEP 5: Update CORS on Backend**

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `CORS_ORIGINS` to your Vercel URL:
```
https://cybernova.vercel.app
```
5. Save changes (service will redeploy automatically)

---

## ✅ Verification Checklist

After deployment, test these:

### Frontend (Vercel)
- [ ] Visit your Vercel URL
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] No console errors

### Backend (Render)
- [ ] Visit `https://your-backend.onrender.com/docs`
- [ ] API documentation loads
- [ ] Health check works: `https://your-backend.onrender.com/health`

### Integration
- [ ] Login works (admin@cybernova.com / Admin@123)
- [ ] Dashboard loads
- [ ] Webinar registration works
- [ ] Service request form works

---

## 🔧 Troubleshooting

### Frontend Issues

**Problem**: "Failed to fetch" errors
- **Solution**: Check that backend URL in `app.js` is correct
- **Solution**: Verify CORS is configured on backend

**Problem**: 404 errors on page refresh
- **Solution**: `vercel.json` should handle this (already configured)

### Backend Issues

**Problem**: "Application failed to start"
- **Solution**: Check Render logs for errors
- **Solution**: Verify all environment variables are set
- **Solution**: Check `requirements.txt` has all dependencies

**Problem**: Database connection errors
- **Solution**: Verify `DATABASE_URL` is correct
- **Solution**: Check Neon database is active
- **Solution**: Ensure database schema is created

**Problem**: CORS errors
- **Solution**: Add Vercel URL to `CORS_ORIGINS` in Render
- **Solution**: Format: `https://your-app.vercel.app` (no trailing slash)

---

## 📊 Deployment Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | **FREE** |
| Render | Free Tier | **FREE** |
| Neon | Free Tier | **FREE** |
| **Total** | | **$0/month** |

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month
- Render: 750 hours/month, sleeps after 15 min inactivity
- Neon: 0.5GB storage, 3GB data transfer

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:

1. **Push to GitHub** → Automatically deploys to both platforms
2. **No manual steps** needed after initial setup
3. **Preview deployments** for pull requests (Vercel)

---

## 🎯 Post-Deployment Tasks

### 1. Custom Domain (Optional)
- **Vercel**: Add custom domain in project settings
- **Render**: Add custom domain in service settings

### 2. Environment Variables
- Never commit `.env` files
- Always use platform environment variable settings

### 3. Monitoring
- **Render**: Check logs in dashboard
- **Vercel**: Check deployment logs and analytics

### 4. Security
- Change default admin password
- Rotate JWT secret key periodically
- Enable 2FA on GitHub, Vercel, and Render

---

## 📝 Important URLs to Save

After deployment, save these:

- **Frontend URL**: `https://your-app.vercel.app`
- **Backend URL**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/cybernova`
- **Neon Dashboard**: `https://console.neon.tech`

---

## 🆘 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Neon Docs**: https://neon.tech/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

**Your deployment is ready! Follow these steps in order and you'll be live in under 30 minutes! 🚀**
