# 75 Soft Tracker — Setup Guide

## What you need
- A Google account (for Firebase)
- Node.js installed (https://nodejs.org)
- A Vercel account to deploy (free at https://vercel.com)

---

## Step 1 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**, name it `75soft` (or anything you like)
3. Disable Google Analytics (not needed), click **"Create project"**

---

## Step 2 — Enable Google Sign-In

1. In your Firebase project, go to **Build → Authentication**
2. Click **"Get started"**
3. Under **Sign-in method**, click **Google** → **Enable** → **Save**

---

## Step 3 — Create a Firestore database

1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → pick a region close to you → **Done**
4. Go to the **Rules** tab and paste the contents of `firestore.rules` from this project, then **Publish**

---

## Step 4 — Copy your Firebase config

1. Go to **Project Settings** (gear icon, top left)
2. Scroll to **"Your apps"**, click the web icon `</>`
3. Register the app (name it anything), skip Firebase Hosting for now
4. Copy the `firebaseConfig` values

---

## Step 5 — Create your `.env` file

In the project folder, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your real Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 6 — Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you should see the login screen!

---

## Step 7 — Deploy to Vercel (so friends can use it)

1. Push your code to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create 75soft --public --push --source=.
   ```
2. Go to https://vercel.com → **"Add New Project"** → import your GitHub repo
3. In the **Environment Variables** section, add all 6 `VITE_FIREBASE_*` variables
4. Click **Deploy**

Your app will be live at `https://your-project.vercel.app` — share this URL with your friends!

---

## Invite friends

Share the Vercel URL with your friends. They sign in with their own Google account and automatically appear on the leaderboard.

## Rules tracked

| Habit | Days |
|-------|------|
| 🏋️ Workout (45+ min) | Every day |
| 👟 Steps (8,000+) | Every day |
| 📖 Reading (20+ min) | Every day |
| 🚫 No Alcohol | Weekdays only |
