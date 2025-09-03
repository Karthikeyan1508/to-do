# Vercel Environment Variables Setup

## Quick Fix for Database Connection Issue

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Find your deployed project (to-do-app-beta-tawny.vercel.app)
3. Click on the project name

### Step 2: Add Environment Variables
1. Go to "Settings" tab
2. Click "Environment Variables" in the left sidebar
3. Add these variables one by one:

**Variable 1:**
- Name: `MONGODB_URI`
- Value: `mongodb+srv://karthikeyan36947_db_user:GykZhzYXLbmq38B0@cluster0.kva9fo9.mongodb.net/todoapp?retryWrites=true&w=majority&appName=Cluster0`
- Environment: Production, Preview, Development (select all)

**Variable 2:**
- Name: `SESSION_SECRET`
- Value: `myTodoApp2024SecretKey!@#$%^&*()_+Random123456789`
- Environment: Production, Preview, Development (select all)

**Variable 3:**
- Name: `NODE_ENV`
- Value: `production`
- Environment: Production

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Step 4: Test
Visit your app URL: https://to-do-app-beta-tawny.vercel.app/todos

---

## MongoDB Atlas IP Whitelist Check

If the above doesn't work, you may need to whitelist Vercel's IPs in MongoDB Atlas:

1. Go to MongoDB Atlas dashboard
2. Click "Network Access" in the left sidebar
3. Check if you have "0.0.0.0/0" (Allow access from anywhere) in your IP whitelist
4. If not, add it:
   - Click "Add IP Address"
   - Select "Allow Access From Anywhere"
   - Click "Confirm"

This allows Vercel's servers to connect to your MongoDB database.
