# Celebra Deployment Guide

## Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/celebra.git
   git push -u origin main
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In the Vercel project settings, add these environment variables. Keep any sensitive keys server-side (no `NEXT_PUBLIC_` prefix) where possible.
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=@gemini_api_key   # mapped to a Vercel secret (server-side only)
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
   vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
   vercel env add NEXT_PUBLIC_GEMINI_API_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "Celebra"
4. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Google" sign-in method
4. Add your domain (e.g., `your-project.vercel.app`)

### 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Start in **production mode**
4. Choose a location close to your users
5. Click "Enable"

### 4. Deploy Firestore Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 5. Enable Storage

1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Use production mode
4. Choose same location as Firestore
5. Click "Done"

### 6. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon (</>)
4. Register your app
5. Copy the configuration values to your `.env.local`

## Gemini API Setup

1. Go to the Google AI Studio or Google Cloud Console and create an API key for the Gemini (Generative AI) service.
2. In Vercel, add the key as a secret (recommended) and then map it to the server env var `GEMINI_API_KEY`:

Using Vercel Dashboard:

- Settings → Secrets → Add Secret named `gemini_api_key` with the key value.
- Settings → Environment Variables → Add `GEMINI_API_KEY` and set its value to `@gemini_api_key`.

Using Vercel CLI:

```powershell
vercel secrets add gemini_api_key "<YOUR_GEMINI_API_KEY>"
vercel env add GEMINI_API_KEY production
# when prompted, use: @gemini_api_key
```

Important: Do NOT expose the Gemini API key to the client bundle (avoid `NEXT_PUBLIC_` prefix for this key). The server route `app/api/ai/generate/route.ts` reads `process.env.GEMINI_API_KEY` only.

## Update Authorized Domains

### Firebase
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains"
3. Example: `your-project.vercel.app`

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to "Authorized JavaScript origins"
5. Add redirect URI: `https://your-project.vercel.app/__/auth/handler`

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Firebase rules deployed
- [ ] Google OAuth domains updated
- [ ] Storage enabled in Firebase
- [ ] Test Google login on live site
- [ ] Test posting functionality
- [ ] Test friend requests
- [ ] Test messaging
- [ ] Test AI chat
- [ ] Verify mobile responsiveness

## Troubleshooting

### Authentication Issues
- Verify OAuth redirect URIs include your Vercel domain
- Check Firebase authorized domains
- Ensure all Firebase env variables are correct

### Firestore Permission Denied
- Deploy Firestore rules using Firebase CLI
- Check rules match your app logic
- Verify user is authenticated

### AI Chat Not Working
- Verify Gemini API key is correct
- Check API key has proper permissions
- Monitor usage limits in Google Cloud Console

### Images Not Loading
- Verify Storage is enabled in Firebase
- Check storage rules allow authenticated users
- Ensure image URLs use HTTPS

## Monitoring & Analytics

### Vercel Analytics
1. Go to your Vercel project
2. Navigate to Analytics tab
3. Enable Web Analytics (free)

### Firebase Analytics
1. In Firebase Console, go to Analytics
2. Click "Enable Google Analytics"
3. Follow the setup wizard

## Performance Optimization

### Recommended Vercel Settings
- **Framework Preset**: Next.js
- **Node.js Version**: 18.x or higher
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Caching
Vercel automatically caches:
- Static assets (images, CSS, JS)
- API routes (with proper cache headers)
- Generated pages

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` in `.gitignore`
2. **Use environment variables**: All sensitive data in Vercel env vars
3. **Enable Firestore rules**: Always use production mode with rules
4. **Monitor API usage**: Check Firebase and Gemini usage regularly
5. **Update dependencies**: Keep packages up to date

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update Firebase authorized domains
6. Update Google OAuth authorized origins

## Support

For issues or questions:
- Check Firebase Console logs
- Check Vercel deployment logs
- Review Firestore rules
- Verify environment variables
- Check browser console for errors

## Production Tips

- Set up Firebase budget alerts
- Monitor Gemini API quota
- Enable Vercel deployment protection
- Set up custom error pages
- Configure proper cache headers
- Enable Vercel Image Optimization

---

🎉 Your Celebra app is now live!
