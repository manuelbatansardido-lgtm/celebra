# 🏗️ Celebra Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CELEBRA APP                              │
│                    (Next.js 14 + React)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Firebase   │    │   Firebase   │    │   Gemini     │
│     Auth     │    │  Firestore   │    │     API      │
│              │    │              │    │              │
│ • Google     │    │ • Users      │    │ • AI Chat    │
│   OAuth      │    │ • Posts      │    │ • Multi      │
│ • Session    │    │ • Chats      │    │   Models     │
│   Mgmt       │    │ • Messages   │    │ • Fallback   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Application Flow

```
1. USER VISITS APP
   ↓
2. Check Authentication
   ├─ Not Logged In → Show Login Page
   │   ↓
   │   Google OAuth
   │   ↓
   │   Username Selection
   │   ↓
   │   Create User Profile
   │
   └─ Logged In → Show Feed
       ↓
       Load Posts (10 at a time)
       ↓
       Infinite Scroll for More
```

## Data Flow Diagram

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       │ Interaction
       ▼
┌─────────────────────────────────┐
│      React Components           │
│  ┌──────────┐  ┌──────────┐    │
│  │  Feed    │  │ Messages │    │
│  │ Component│  │Component │    │
│  └──────────┘  └──────────┘    │
└────────┬────────────────────────┘
         │
         │ State Management
         ▼
┌─────────────────────────────────┐
│     Auth Context                │
│  (User State & Methods)         │
└────────┬────────────────────────┘
         │
         │ Firebase SDK
         ▼
┌─────────────────────────────────┐
│         Firebase                │
│  ┌──────────┐  ┌──────────┐    │
│  │Firestore │  │  Auth    │    │
│  │          │  │          │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

## Component Hierarchy

```
App (layout.tsx)
└── AuthProvider
    ├── Auth Component (if not logged in)
    │   └── Google Login Button
    │       └── Username Input
    │
    └── Main App (if logged in)
        ├── Navbar
        │   ├── Logo
        │   ├── Search Bar
        │   ├── Navigation Icons
        │   └── Profile Dropdown
        │
        └── Routes
            ├── / (Home/Feed)
            │   ├── CreatePost
            │   └── Feed
            │       └── PostCard[]
            │           ├── Like Button
            │           ├── Comment Button
            │           └── Share Button
            │
            ├── /friends
            │   ├── Friend Requests List
            │   └── Friends List
            │
            ├── /messages
            │   ├── Chat List (Left Panel)
            │   └── Chat Window (Right Panel)
            │       ├── Chat Header
            │       ├── Messages List
            │       └── Message Input
            │
            ├── /ai-chat
            │   ├── AI Chat Header
            │   ├── Messages List
            │   │   ├── User Messages
            │   │   └── AI Responses
            │   └── Chat Input
            │
            └── /profile/[userId]
                ├── Profile Header
                │   ├── Profile Picture
                │   ├── User Info
                │   ├── Edit Button (own profile)
                │   └── Add Friend Button (others)
                ├── Bio Section
                ├── Stats (Posts, Friends)
                └── User Posts
```

## Database Schema

```
Firestore Database
│
├── users (collection)
│   └── {userId} (document)
│       ├── uid: string
│       ├── email: string
│       ├── username: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── bio: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│       │
│       ├── friends (subcollection)
│       │   └── {friendId} (document)
│       │       ├── uid: string
│       │       ├── username: string
│       │       ├── displayName: string
│       │       ├── photoURL: string
│       │       └── addedAt: timestamp
│       │
│       └── friendRequests (subcollection)
│           └── {requestId} (document)
│               ├── fromUserId: string
│               ├── fromUsername: string
│               ├── fromDisplayName: string
│               ├── fromPhotoURL: string
│               ├── toUserId: string
│               ├── status: string
│               └── createdAt: timestamp
│
├── posts (collection)
│   └── {postId} (document)
│       ├── userId: string
│       ├── username: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── content: string
│       ├── likes: array[string]
│       ├── likeCount: number
│       ├── commentCount: number
│       ├── shareCount: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│       │
│       ├── comments (subcollection)
│       │   └── {commentId} (document)
│       │       ├── userId: string
│       │       ├── username: string
│       │       ├── displayName: string
│       │       ├── photoURL: string
│       │       ├── content: string
│       │       └── createdAt: timestamp
│       │
│       └── shares (subcollection)
│           └── {shareId} (document)
│               ├── userId: string
│               └── sharedAt: timestamp
│
└── chats (collection)
    └── {chatId} (document)
        ├── participants: array[string]
        ├── participantDetails: map
        ├── lastMessage: string
        ├── lastMessageTime: timestamp
        └── createdAt: timestamp
        │
        └── messages (subcollection)
            └── {messageId} (document)
                ├── senderId: string
                ├── senderUsername: string
                ├── senderDisplayName: string
                ├── senderPhotoURL: string
                ├── content: string
                ├── createdAt: timestamp
                └── read: boolean
```

## Authentication Flow

```
┌──────────────┐
│ User clicks  │
│ Google Login │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Firebase Auth    │
│ Google OAuth     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Check if user    │
│ has username     │
└──────┬───────────┘
       │
       ├─ Yes → Redirect to Feed
       │
       └─ No → Show Username Input
                │
                ▼
           ┌────────────────┐
           │ Validate       │
           │ Username       │
           │ (must be unique)│
           └────┬───────────┘
                │
                ▼
           ┌────────────────┐
           │ Create User    │
           │ Document in    │
           │ Firestore      │
           └────┬───────────┘
                │
                ▼
           ┌────────────────┐
           │ Redirect to    │
           │ Feed           │
           └────────────────┘
```

## Message Flow

```
User A                    Firestore                    User B
  │                          │                           │
  │ Send Message             │                           │
  ├─────────────────────────>│                           │
  │                          │                           │
  │                          │ Real-time Listener        │
  │                          ├──────────────────────────>│
  │                          │                           │
  │                          │    Update UI              │
  │                          │                           │
  │                          │<──────────────────────────┤
  │                          │                           │
  │                          │   New Message Displayed   │
  │                          │                           │
```

## AI Chat Flow

```
┌──────────────┐
│ User sends   │
│ message      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Try Gemini 2.0   │
│ Flash Exp        │
└──────┬───────────┘
       │
       ├─ Success → Return Response
       │
       └─ Error
           │
           ▼
      ┌──────────────────┐
      │ Try Gemini 1.5   │
      │ Flash            │
      └──────┬───────────┘
             │
             ├─ Success → Return Response
             │
             └─ Error
                 │
                 ▼
            ┌──────────────────┐
            │ Try Gemini 1.5   │
            │ Flash-8B         │
            └──────┬───────────┘
                   │
                   ├─ Success → Return Response
                   │
                   └─ Error → Show Error Message
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│          GitHub Repository              │
└───────────────┬─────────────────────────┘
                │
                │ Git Push
                ▼
┌─────────────────────────────────────────┐
│         Vercel Platform                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Build Process                 │   │
│  │   • npm install                 │   │
│  │   • next build                  │   │
│  │   • Optimize assets             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Environment Variables         │   │
│  │   • Firebase Config             │   │
│  │   • Gemini API Key              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Edge Network                  │   │
│  │   • Global CDN                  │   │
│  │   • SSL Certificate             │   │
│  │   • Custom Domain (optional)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                │
                │ Serves to
                ▼
        ┌───────────────┐
        │     Users     │
        │   Worldwide   │
        └───────────────┘
```

## File Structure & Responsibilities

```
📁 app/
├── layout.tsx         → Root layout, wraps all pages with AuthProvider
├── page.tsx           → Home page, shows Feed or Auth based on login
├── globals.css        → Global styles, Tailwind imports
├── friends/           → Friend management features
├── messages/          → Real-time messaging
├── ai-chat/           → Gemini AI integration
└── profile/[userId]/  → Dynamic user profiles

📁 components/
├── Auth.tsx           → Login form & username signup
├── Navbar.tsx         → Navigation bar with links
├── Feed.tsx           → Posts feed with infinite scroll
├── CreatePost.tsx     → Post creation form
└── PostCard.tsx       → Individual post display

📁 contexts/
└── AuthContext.tsx    → Global auth state & methods

📁 lib/
└── firebase.ts        → Firebase initialization & exports

📁 types/
└── index.ts           → TypeScript interfaces

Configuration:
├── next.config.js     → Next.js settings
├── tailwind.config.ts → Tailwind customization
├── tsconfig.json      → TypeScript settings
├── firestore.rules    → Database security
├── storage.rules      → Storage security
└── vercel.json        → Deployment config
```

## API Endpoints

```
Client-Side API Calls:

Firebase Auth:
├── signInWithPopup()
├── signOut()
└── onAuthStateChanged()

Firebase Firestore:
├── getDocs()          → Fetch documents
├── addDoc()           → Create document
├── updateDoc()        → Update document
├── deleteDoc()        → Delete document
├── setDoc()           → Set document
├── query()            → Query documents
└── onSnapshot()       → Real-time listener

Firebase Storage:
├── uploadBytes()      → Upload file
└── getDownloadURL()   → Get file URL

Gemini API:
└── generateContent()  → Generate AI response
```

---

This architecture is designed for:
✅ Scalability
✅ Security
✅ Performance
✅ Maintainability
✅ User Experience
