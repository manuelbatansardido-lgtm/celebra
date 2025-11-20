# Celebra - Quick Start Guide

Welcome to Celebra! Follow these steps to get your social media app running.

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 18 or higher installed
- ✅ A Firebase account
- ✅ A Google Cloud account (for Gemini API)
- ✅ Git installed (optional, for deployment)

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

This will install all required packages.

### Step 2: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Name it "Celebra" (or any name you prefer)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 3: Enable Firebase Services

#### Enable Authentication:
1. In your Firebase project, click "Authentication" in the sidebar
2. Click "Get started"
3. Click on "Google" sign-in provider
4. Toggle "Enable"
5. Enter a project support email
6. Click "Save"

#### Enable Firestore:
1. Click "Firestore Database" in the sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location near you
5. Click "Enable"

#### Enable Storage:
1. Click "Storage" in the sidebar
2. Click "Get started"
3. Click "Next" (use default security rules)
4. Choose the same location as Firestore
5. Click "Done"

### Step 4: Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Enter app nickname: "Celebra Web"
6. Click "Register app"
7. Copy the firebaseConfig values

### Step 5: Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Click "Create API key in new project" (or select existing project)
5. Copy the API key

### Step 6: Create Environment File

1. Copy the `.env.example` file to `.env.local`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```

**Mac/Linux:**
```bash
cp .env.example .env.local
```

2. Open `.env.local` in a text editor
3. Fill in your Firebase configuration and Gemini API key:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 7: Deploy Firestore Rules

1. Install Firebase CLI (if not already installed):

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase (select Firestore only):

```bash
firebase init firestore
```

- Select "Use an existing project"
- Choose your Celebra project
- Press Enter for default firestore.rules
- Press Enter for default firestore.indexes.json

4. Deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

### Step 8: Run the Development Server

```bash
npm run dev
```

Your app will be running at: http://localhost:3000

### Step 9: Test the App

1. Open http://localhost:3000 in your browser
2. Click "Continue with Google"
3. Sign in with your Google account
4. Create a unique username
5. Start using Celebra! 🎉

## ✅ Verification Checklist

Make sure everything works:

- [ ] Google login works
- [ ] Can create a username
- [ ] Can create a post
- [ ] Feed displays posts
- [ ] Can like posts
- [ ] Can comment on posts
- [ ] Can visit profile page
- [ ] Can edit profile
- [ ] Can send friend request
- [ ] Can accept friend request
- [ ] Can send messages to friends
- [ ] AI chat responds to messages

## 🐛 Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
**Solution:** 
1. Go to Firebase Console → Authentication → Settings
2. Add `localhost` to Authorized domains

### "Firestore permission denied"
**Solution:**
1. Run `firebase deploy --only firestore:rules`
2. Make sure you're logged in with the correct account

### "Gemini API error"
**Solution:**
1. Verify your API key is correct
2. Check you haven't exceeded the free tier limit
3. Try refreshing the API key

### Environment variables not loading
**Solution:**
1. Make sure the file is named `.env.local` (not `.env.local.txt`)
2. Restart the development server (`Ctrl+C` then `npm run dev`)

### Module not found errors
**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 📚 Next Steps

### Deploy to Vercel:
See `DEPLOYMENT.md` for detailed deployment instructions.

### Customize the App:
- Change colors in `tailwind.config.ts`
- Update the app name in `app/layout.tsx`
- Modify the logo in components

### Add Features:
- Image uploads for posts
- Video sharing
- Dark mode
- Notifications
- Group chats

## 💡 Tips

1. **Free Tier Limits:**
   - Firebase: 50K reads/day, 20K writes/day
   - Gemini API: 15 requests/minute
   - Keep these in mind for usage

2. **Development:**
   - Use Chrome DevTools for debugging
   - Check browser console for errors
   - Monitor Firebase Console for database activity

3. **Performance:**
   - The app loads 10 items at a time to save reads
   - Infinite scroll loads more as you scroll
   - Messages load in batches of 10

## 🆘 Need Help?

- Check the README.md for detailed documentation
- Review DEPLOYMENT.md for deployment help
- Check Firebase Console logs for errors
- Review browser console for client-side errors

## 🎉 You're All Set!

Enjoy using Celebra, your new social media platform!

---

Made with ❤️ by Eywron
