# Celebra - Social Media Web App

A modern, full-featured social media platform built with Next.js, Firebase, and Gemini AI.

![Celebra](https://img.shields.io/badge/Celebra-Social%20Media-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Firebase](https://img.shields.io/badge/Firebase-10-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🔐 Authentication
- Google OAuth login
- Unique username validation during signup
- Secure Firebase Authentication

### 📱 Social Features
- **Posts**: Create, edit, delete, like, comment, and share posts
- **Feed**: Infinite scroll with optimized pagination (10 posts/batch)
- **Friends**: Send/accept/reject friend requests
- **Messaging**: Real-time chat with friends (Messenger-style UI)
- **Profiles**: View and edit profiles, upload profile pictures
- **Friend Management**: Add friends, view friend lists

### 🤖 Celebra AI
- Powered by Google Gemini API
- Supports multiple Gemini models with automatic fallback:
  - Gemini 2.0 Flash Exp
  - Gemini 1.5 Flash
  - Gemini 1.5 Flash-8B
- Advanced responses with:
  - Numbered lists and bullet points
  - Tables for data organization
  - Multi-paragraph explanations
  - Step-by-step guides

### 🎨 Design
- Modern, clean UI with Tailwind CSS
- Mobile-responsive design
- Gradient accents and smooth animations
- Intuitive UX similar to Facebook/Messenger

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- Google Cloud project with Gemini API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eywron/celebra.git
   cd celebra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Gemini API Key
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication → Google sign-in method
   - Enable Firestore Database
   - Enable Storage
   - Deploy the Firestore rules from `firestore.rules`:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Get Gemini API Key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create an API key
   - Add it to your `.env.local` file

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eywron/celebra)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configure Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all variables from `.env.local`

5. **Redeploy**
   ```bash
   vercel --prod
   ```

## 🏗️ Project Structure

```
celebra/
├── app/                      # Next.js app directory
│   ├── ai-chat/             # Celebra AI chat page
│   ├── friends/             # Friends management page
│   ├── messages/            # Messaging/chat page
│   ├── profile/[userId]/    # User profile pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home/feed page
├── components/              # React components
│   ├── Auth.tsx             # Authentication component
│   ├── CreatePost.tsx       # Post creation form
│   ├── Feed.tsx             # Main feed component
│   ├── Navbar.tsx           # Navigation bar
│   └── PostCard.tsx         # Individual post card
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── lib/                     # Utility libraries
│   └── firebase.ts          # Firebase configuration
├── types/                   # TypeScript type definitions
│   └── index.ts             # All type definitions
├── public/                  # Static assets
├── firestore.rules          # Firestore security rules
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md               # This file
```

## 🔧 Configuration Files

### firestore.rules
Security rules for Firestore are included in the `firestore.rules` file. Deploy them using:
```bash
firebase deploy --only firestore:rules
```

### Firestore Collections Structure

- **users**: User profiles and account information
  - `users/{userId}/friends`: User's friend list
  - `users/{userId}/friendRequests`: Pending friend requests
- **posts**: All user posts
  - `posts/{postId}/comments`: Comments on posts
  - `posts/{postId}/shares`: Post shares
- **chats**: Chat conversations
  - `chats/{chatId}/messages`: Messages in a chat
- **aiChats**: AI chat history (optional for persistence)

## 🎯 Optimization Features

### Firestore Free Tier Optimization
- **Pagination**: All lists load 10 items at a time
- **Infinite Scroll**: Posts and messages load incrementally
- **Efficient Queries**: Indexed queries for better performance
- **Lazy Loading**: Data fetched only when needed

### Performance
- Server-side rendering with Next.js
- Optimized images with Next.js Image component
- Code splitting and lazy loading
- Cached queries where appropriate

## 📱 Mobile Responsiveness

The app is fully responsive with:
- Adaptive layouts for mobile, tablet, and desktop
- Touch-friendly UI elements
- Optimized navigation for small screens
- Responsive typography and spacing

## 🔒 Security

- Firebase Authentication for secure user management
- Firestore security rules to protect user data
- Client-side validation
- Secure API key handling via environment variables

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini API
- **Deployment**: Vercel
- **Icons**: React Icons

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Eywron**
- GitHub: [@eywron](https://github.com/eywron)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if you like this project!

## 📝 Notes

- Make sure to set up Firebase indexes as needed (Firestore will prompt you)
- Keep your API keys secure and never commit them to version control
- The Gemini API has usage limits; monitor your usage in Google Cloud Console
- For production, consider implementing rate limiting and additional security measures

## 🐛 Known Issues

- None at the moment! Report any issues on GitHub.

## 🔮 Future Enhancements

- [ ] Video and image posts
- [ ] Stories feature
- [ ] Dark mode
- [ ] Notifications system
- [ ] Advanced search functionality
- [ ] Post analytics
- [ ] Voice messages in chat
- [ ] Group chats
- [ ] Emoji reactions

---

Made with ❤️ using Next.js and Firebase
