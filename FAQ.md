# ❓ Celebra - FAQ & Troubleshooting

## 🆘 Common Issues & Solutions

### Installation & Setup

#### Q: `npm install` fails
**A:** Try these steps in order:
1. Delete `node_modules` folder and `package-lock.json`
2. Clear npm cache: `npm cache clean --force`
3. Run `npm install` again
4. If still failing, check Node.js version (needs 18+)

#### Q: Environment variables not loading
**A:** 
1. Ensure file is named exactly `.env.local` (not `.env.local.txt`)
2. Restart the development server completely
3. Check for typos in variable names (they're case-sensitive)
4. Make sure there are no spaces around `=` sign

#### Q: TypeScript errors everywhere
**A:**
1. Run `npm install` to install all dependencies
2. These errors are expected before installation
3. After installation, restart VS Code
4. Run `npm run dev` - errors should disappear

### Firebase Issues

#### Q: "Firebase: Error (auth/unauthorized-domain)"
**A:**
1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add `localhost` for local development
4. Add your Vercel domain for production

#### Q: "Firestore: Missing or insufficient permissions"
**A:**
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Make sure you're logged in (check auth state)
3. Verify the rules file matches the app logic
4. Check Firebase Console → Firestore → Rules

#### Q: Can't upload profile pictures
**A:**
1. Enable Storage in Firebase Console
2. Deploy storage rules: `firebase deploy --only storage`
3. Check browser console for specific errors
4. Verify file size isn't too large (Firebase has limits)

#### Q: "Cannot read property of undefined" in Firebase
**A:**
1. Check that all environment variables are set correctly
2. Verify Firebase config in `.env.local`
3. Make sure Firebase project exists
4. Check Firebase Console for any service outages

### Authentication Issues

#### Q: Google login not working
**A:**
1. Check Firebase Console → Authentication → Sign-in method
2. Ensure Google provider is enabled
3. Verify authorized domains include your domain
4. Check Google Cloud Console OAuth settings
5. Clear browser cache and cookies

#### Q: Username validation always fails
**A:**
1. Check Firestore rules allow reading `users` collection
2. Verify the query in `AuthContext.tsx` is correct
3. Check browser console for specific error
4. Try a different username (minimum 3 characters)

#### Q: Stuck on loading screen after login
**A:**
1. Check browser console for errors
2. Verify user document was created in Firestore
3. Clear browser cache
4. Try signing out and in again
5. Check AuthContext is properly wrapping the app

### Posts & Feed Issues

#### Q: Feed not loading posts
**A:**
1. Create a test post first
2. Check Firestore Console - verify posts exist
3. Check browser console for query errors
4. Verify Firestore indexes are created
5. Check internet connection

#### Q: Infinite scroll not working
**A:**
1. Create more than 10 posts to test
2. Scroll to bottom of page completely
3. Check browser console for errors
4. Verify `IntersectionObserver` is supported (modern browsers)

#### Q: Can't like posts
**A:**
1. Verify you're logged in
2. Check Firestore rules allow updates
3. Check browser console for errors
4. Try refreshing the page

#### Q: Can't delete own posts
**A:**
1. Verify you're the post owner
2. Check Firestore security rules
3. Verify delete function has correct postId
4. Check browser console for errors

### Messaging Issues

#### Q: Messages not sending
**A:**
1. Verify both users are friends
2. Check Firestore rules for chats collection
3. Check browser console for errors
4. Try refreshing the page

#### Q: Chat list not updating
**A:**
1. Send a message to trigger update
2. Check real-time listeners are active
3. Refresh the page
4. Check Firestore Console for chat documents

#### Q: Can't see friend's messages
**A:**
1. Verify friendship exists in Firestore
2. Check chat participants array includes both users
3. Verify Firestore rules allow reading
4. Check browser console for errors

### AI Chat Issues

#### Q: "All AI models are currently unavailable"
**A:**
1. Verify Gemini API key is correct
2. Check API key hasn't expired
3. Verify you haven't exceeded free tier limit
4. Check Google Cloud Console for API status
5. Try again in a few minutes (rate limiting)

#### Q: AI responses are slow
**A:**
1. This is normal - AI generation takes time
2. Fallback system tries multiple models
3. Check your internet connection
4. Consider upgrading Gemini API tier

#### Q: AI gives error responses
**A:**
1. Check API key is correctly set
2. Verify API is enabled in Google Cloud
3. Check for rate limiting (15 requests/minute free)
4. Review error message in browser console

### Friend System Issues

#### Q: Friend request not sending
**A:**
1. Verify target user exists
2. Check you're not already friends
3. Check Firestore rules allow writes
4. Check browser console for errors

#### Q: Can't accept friend request
**A:**
1. Refresh the page
2. Verify request still exists in Firestore
3. Check Firestore rules allow writes to friends collection
4. Check browser console for errors

### Profile Issues

#### Q: Profile not loading
**A:**
1. Verify userId in URL is correct
2. Check user exists in Firestore
3. Check browser console for errors
4. Try going to your own profile first

#### Q: Can't edit profile
**A:**
1. Verify you're on your own profile
2. Click "Edit Profile" button
3. Check Firestore rules allow updates
4. Check browser console for errors

### Deployment Issues

#### Q: Vercel deployment fails
**A:**
1. Check build logs for specific error
2. Verify all dependencies are in `package.json`
3. Check Node.js version compatibility
4. Verify no TypeScript errors locally
5. Check environment variables are set

#### Q: App works locally but not on Vercel
**A:**
1. Check all environment variables are set in Vercel
2. Verify Firebase domains include your Vercel URL
3. Check build logs for errors
4. Verify API keys are correct
5. Clear Vercel cache and redeploy

#### Q: Images not loading on deployed site
**A:**
1. Check Firebase Storage is enabled
2. Verify storage rules are deployed
3. Check domain is added to Firebase
4. Check image URLs use HTTPS

## 💡 Best Practices

### Development
- Always check browser console first
- Use React DevTools for debugging
- Check Network tab for failed requests
- Read error messages carefully

### Firebase
- Deploy rules after every change
- Monitor usage in Firebase Console
- Set up budget alerts
- Use indexes for complex queries

### Security
- Never commit `.env.local` to git
- Rotate API keys if exposed
- Keep dependencies updated
- Review Firestore rules regularly

### Performance
- Minimize Firestore reads/writes
- Use pagination everywhere
- Optimize images before upload
- Cache data when appropriate

## 🔍 Debugging Tips

### Browser Console
```javascript
// Check if user is logged in
console.log(user)

// Check environment variables (client-side only)
console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

// Check Firebase initialization
console.log(auth, db, storage)
```

### Firebase Console
1. **Firestore**: Check database contents
2. **Authentication**: Check user list
3. **Storage**: Check uploaded files
4. **Rules**: Test rules with simulator

### Network Tab
1. Check failed requests
2. Look for 401/403 errors (auth/permission)
3. Check request payloads
4. Verify API endpoints

## 📊 Performance Tips

### Optimize Firestore Queries
```typescript
// Good: Limited query
query(collection(db, 'posts'), limit(10))

// Bad: Unlimited query
collection(db, 'posts')
```

### Use Indexes
Firebase will prompt you to create indexes. Click the link and wait for creation.

### Lazy Load Images
Already implemented with Next.js Image component.

### Minimize Re-renders
Use `React.memo()` for expensive components.

## 🎯 Feature-Specific FAQs

### Posts
**Q: How many posts can I have?**  
A: Unlimited, but consider pagination for performance.

**Q: Can I edit posts?**  
A: Yes, click the menu on your own posts.

**Q: How do shares work?**  
A: Currently tracked but not fully implemented (future feature).

### Messaging
**Q: Can I delete messages?**  
A: Currently no (future feature).

**Q: Is messaging real-time?**  
A: Yes, uses Firestore real-time listeners.

**Q: Can I message non-friends?**  
A: No, you must be friends first.

### AI Chat
**Q: Does AI remember context?**  
A: Within same session, yes. Not persistent across reloads.

**Q: Can I chat with AI offline?**  
A: No, requires internet and API access.

**Q: Which Gemini model is best?**  
A: App tries them in order of quality (2.0 Flash Exp first).

## 🚀 Optimization Checklist

- [ ] All images optimized
- [ ] Firestore indexes created
- [ ] Security rules deployed
- [ ] Environment variables set
- [ ] API keys secured
- [ ] Error boundaries implemented
- [ ] Loading states everywhere
- [ ] Mobile tested
- [ ] Different browsers tested
- [ ] Production build tested

## 📞 Getting More Help

### Resources
1. **Next.js Docs**: https://nextjs.org/docs
2. **Firebase Docs**: https://firebase.google.com/docs
3. **Tailwind Docs**: https://tailwindcss.com/docs
4. **Gemini API Docs**: https://ai.google.dev/docs

### Check These Files
- `README.md` - Full documentation
- `QUICKSTART.md` - Setup guide
- `DEPLOYMENT.md` - Deployment help
- `ARCHITECTURE.md` - System design
- `COMMANDS.md` - Useful commands

### Still Stuck?
1. Check browser console
2. Check Firebase Console
3. Check Vercel logs
4. Review error messages
5. Google the specific error
6. Check GitHub issues
7. Ask on Stack Overflow

## 🐛 Known Limitations

1. **Free Tier Limits**: Firebase and Gemini have daily limits
2. **No Offline Mode**: Requires internet connection
3. **No Push Notifications**: Would require additional setup
4. **Text-Only Posts**: Images/videos not yet supported
5. **No Post Editing History**: Only current version saved

## 🔮 Future Features

These aren't implemented yet but could be added:
- Image/video posts
- Story feature
- Dark mode
- Push notifications
- Advanced search
- Post analytics
- Voice messages
- Group chats
- Emoji reactions
- Post scheduling

---

**Remember**: Most issues are simple configuration problems. Check the basics first! 🎯
