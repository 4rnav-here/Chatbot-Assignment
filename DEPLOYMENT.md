# 🚀 Deployment Guide

Complete guide to deploy the ChatBot Platform with **Supabase** (database), **Railway** (backend), and **Vercel** (frontend).

---

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `chatbot-platform` (or any name)
   - **Database Password**: Create a strong password (**save this!**)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait ~2 minutes

### 1.2 Get Connection String
1. In your project dashboard, go to **Settings** (gear icon) → **Database**
2. Scroll to **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string, it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghij.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 1.3 Apply Database Schema
Run this command in your backend folder:

```bash
cd backend

# Set the DATABASE_URL temporarily for migration
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Deploy existing migrations to Supabase
npx prisma migrate deploy

# Verify tables were created
npx prisma db pull
```

> [!TIP]
> You can also run `npx prisma studio` to open a visual database browser and verify your tables exist.

---

## Step 2: Deploy Backend on Railway

### 2.1 Prepare Backend for Deployment
Your backend needs a few adjustments:

**Update [package.json](file:///d:/Codes/ChatBot%20Assignment/backend/package.json)** - Add start script and engines:
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

**Create [Procfile](file:///d:/Codes/ChatBot%20Assignment/backend/Procfile)** (optional, Railway auto-detects):
```
web: npm start
```

### 2.2 Push to GitHub
If not already on GitHub:
```bash
cd "d:\Codes\ChatBot Assignment"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chatbot-platform.git
git push -u origin main
```

### 2.3 Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Choose the `backend` folder as the root directory
5. Click **"Add Variables"** and add these environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `JWT_SECRET` | A random secure string (use a password generator) |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FRONTEND_URL` | (add after frontend is deployed) |
| `NODE_ENV` | `production` |

6. Railway will auto-deploy. Click **"Settings"** → **"Generate Domain"** to get your backend URL
   - Example: `https://chatbot-backend-production.up.railway.app`

### 2.4 Verify Backend
Test your API is working:
```
https://YOUR-RAILWAY-URL/api/health
```
Should return: `{"status":"ok","timestamp":"..."}`

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Update API URL
Edit [frontend/js/api.js](file:///d:/Codes/ChatBot%20Assignment/frontend/js/api.js) line 25:

```javascript
// Change from localhost to your Railway URL
const API_BASE_URL = 'https://YOUR-RAILWAY-URL.up.railway.app/api';
```

Or better, use environment detection:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://YOUR-RAILWAY-URL.up.railway.app/api';
```

### 3.2 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Other`
5. Click **"Deploy"**

You'll get a URL like: `https://chatbot-platform.vercel.app`

### 3.3 Update CORS on Backend
Go back to Railway and add/update the environment variable:
```
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

---

## Step 4: Final Configuration

### 4.1 Update CORS in Backend
Your `index.js` should handle the production frontend URL:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

### 4.2 Test Everything
1. Open your Vercel frontend URL
2. Register a new account
3. Create a project
4. Start chatting!

---

## 📌 Quick Reference

| Component | Provider | URL |
|-----------|----------|-----|
| Database | Supabase | (Dashboard: supabase.com/dashboard) |
| Backend API | Railway | `https://xxx.railway.app/api` |
| Frontend | Vercel | `https://xxx.vercel.app` |

---

## 🔧 Troubleshooting

### "Connection refused" errors
- Check your `DATABASE_URL` has the correct password
- Ensure SSL is enabled: add `?sslmode=require` to the URL

### CORS errors in browser
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Make sure there's no trailing slash

### Prisma errors on Railway
- Run migrations: add a build command in Railway settings:
  ```
  npx prisma generate && npx prisma migrate deploy
  ```

### API returns 401 Unauthorized
- Check `JWT_SECRET` is set in Railway
- Clear browser localStorage and login again

---

## 💰 Costs

| Service | Free Tier |
|---------|-----------|
| Supabase | 500MB database, 2 projects |
| Railway | $5 free credits (~500 hours) |
| Vercel | Unlimited for hobby projects |

All three have generous free tiers suitable for personal projects!
