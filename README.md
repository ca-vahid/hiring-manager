# Junior IT Hiring Manager

A comprehensive application for managing the IT hiring process, including candidate tracking, document management, and AI-powered candidate analysis.

## Features

- **Authentication System**: Secure Firebase authentication with email/password and Google sign-in
- **Candidate Management**: Track and manage IT candidates through the hiring process
- **Document Storage**: Upload and manage resumes, cover letters, notes, and interview transcripts
- **AI-Powered Analysis**: Analyze candidate documents using AI to extract skills, experience, and education
- **Candidate Scoring**: Automated scoring system with customizable category weights
- **Comparison Tool**: Compare up to 3 candidates side-by-side
- **Firebase Integration**: Secure data storage with Firestore Database and Firebase Storage

## Technologies Used

- **Frontend**: React with Next.js 14 App Router
- **Styling**: TailwindCSS for responsive design
- **Database**: Firebase Firestore for real-time data storage
- **Authentication**: Firebase Authentication
- **File Storage**: Firebase Storage for document management
- **AI Integration**: OpenAI and Google Gemini API integration for document analysis
- **Performance**: Server-side rendering and client-side interactivity

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/ca-vahid/hiring-manager.git
cd hiring-manager
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication, Firestore Database, and Storage
   - Create a web app and copy the configuration

4. Set up environment variables
   - Create a `.env.local` file with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

5. Run the development server
```bash
npm run dev
```

6. Configure Firebase Security Rules
   - See the Firebase Debug page in the application for recommended security rules
   - Apply the rules to both Firestore Database and Storage

## Troubleshooting

If you encounter issues with Firebase permissions, use the built-in Firebase Debug tool:
1. Sign in to the application
2. Click on your profile icon
3. Select "Firebase Debug" from the menu
4. Run the connection test to diagnose any issues