# 🛠️ Celebra - Common Commands

## Development Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
App runs at: http://localhost:3000

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Linter
```bash
npm run lint
```

## Firebase Commands

### Login to Firebase
```bash
firebase login
```

### Initialize Firestore
```bash
firebase init firestore
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

### Deploy All Rules
```bash
firebase deploy --only firestore:rules,storage
```

## Vercel Commands

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Deploy to Preview
```bash
vercel
```

### Deploy to Production
```bash
vercel --prod
```

### Add Environment Variable
```bash
vercel env add VARIABLE_NAME
```

### List Environment Variables
```bash
vercel env ls
```

## Git Commands

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Add Remote Origin
```bash
git remote add origin https://github.com/yourusername/celebra.git
```

### Push to GitHub
```bash
git branch -M main
git push -u origin main
```

### Create New Branch
```bash
git checkout -b feature-name
```

### Commit Changes
```bash
git add .
git commit -m "Description of changes"
git push
```

## Package Management

### Update All Packages
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

### Install Specific Package
```bash
npm install package-name
```

### Install Dev Dependency
```bash
npm install --save-dev package-name
```

### Remove Package
```bash
npm uninstall package-name
```

## Troubleshooting Commands

### Clear Node Modules and Reinstall
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Check Firebase Project
```bash
firebase projects:list
```

### Use Specific Firebase Project
```bash
firebase use project-name
```

### View Firebase Logs
```bash
firebase functions:log
```

## Development Tips

### Run with Custom Port
```bash
npm run dev -- -p 3001
```

### Build and Analyze Bundle Size
```bash
npm run build
# Then check .next folder
```

### Type Check
```bash
npx tsc --noEmit
```

### Format Code (if Prettier is installed)
```bash
npx prettier --write .
```

## Environment Variables

### Test Environment Variables
Create a test script in package.json:
```json
"scripts": {
  "test:env": "node -e \"console.log(process.env)\""
}
```

Then run:
```bash
npm run test:env
```

## Quick Setup (PowerShell)

### Run Setup Script
```powershell
.\setup.ps1
```

### Create .env.local from Example
```powershell
Copy-Item .env.example .env.local
```

## Database Management

### Export Firestore Data
```bash
firebase firestore:export gs://your-bucket/backup
```

### Import Firestore Data
```bash
firebase firestore:import gs://your-bucket/backup
```

## Monitoring

### Check Build Errors
```bash
npm run build 2>&1 | Out-File build-errors.log
```

### Monitor Development Server
Development server automatically reloads on file changes.

## Production Checklist

Before deploying to production:

```bash
# 1. Build the project
npm run build

# 2. Test the production build
npm start

# 3. Check for TypeScript errors
npx tsc --noEmit

# 4. Run linter
npm run lint

# 5. Deploy Firestore rules
firebase deploy --only firestore:rules

# 6. Deploy to Vercel
vercel --prod
```

## Useful Aliases (Add to PowerShell Profile)

```powershell
function dev { npm run dev }
function build { npm run build }
function deploy { vercel --prod }
function fb-deploy { firebase deploy --only firestore:rules }
```

To add these, edit your PowerShell profile:
```powershell
notepad $PROFILE
```

## Emergency Commands

### Rollback Vercel Deployment
```bash
vercel rollback
```

### Force Reinstall Everything
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### Reset Firebase Rules to Default
```bash
# Edit firestore.rules to basic rules, then:
firebase deploy --only firestore:rules
```

---

💡 **Tip**: Bookmark this file for quick reference!

For detailed guides, see:
- `QUICKSTART.md` - Setup guide
- `DEPLOYMENT.md` - Deployment guide
- `README.md` - Full documentation
