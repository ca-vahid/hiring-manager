'use client';

import Link from 'next/link';

export default function SetupGuidePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Setup Guide</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Firebase Setup Guide</h2>
          <p className="mb-6">
            Follow these steps to set up Firebase for the Junior IT Hiring Manager application.
          </p>

          <div className="space-y-6">
            {/* Firebase Project Setup */}
            <div>
              <h3 className="text-lg font-medium mb-2">1. Create a Firebase Project</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase Console</a></li>
                <li>Click "Add project" and follow the steps to create a new project</li>
                <li>Once your project is created, you'll be redirected to the project dashboard</li>
              </ol>
            </div>

            {/* Firebase Authentication Setup */}
            <div>
              <h3 className="text-lg font-medium mb-2">2. Enable Authentication</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>In the left sidebar, click "Authentication"</li>
                <li>Click "Get started"</li>
                <li>Enable "Email/Password" authentication method</li>
                <li>Enable "Google" authentication method</li>
                <li>For Google auth, you may need to configure the OAuth consent screen and add your domain</li>
              </ol>
            </div>

            {/* Firebase Firestore Setup */}
            <div>
              <h3 className="text-lg font-medium mb-2">3. Set Up Firestore Database</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>In the left sidebar, click "Firestore Database"</li>
                <li>Click "Create database"</li>
                <li>Choose "Start in production mode" or "Start in test mode" (for development)</li>
                <li>Select a location for your database (choose the region closest to your users)</li>
                <li>Firestore will be initialized</li>
              </ol>
            </div>

            {/* Firebase Storage Setup */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-700">4. Set Up Firebase Storage</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>In the left sidebar, click "Storage"</li>
                <li>Click "Get started"</li>
                <li>Choose "Start in production mode" or "Start in test mode"</li>
                <li>Select a location for your storage bucket</li>
                <li>Once initialized, go to the "Rules" tab and update the rules to:</li>
                <li>
                  <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                  </pre>
                </li>
                <li>Click "Publish" to save the rules</li>
              </ol>
            </div>

            {/* Configure Firebase in App */}
            <div>
              <h3 className="text-lg font-medium mb-2">5. Configure Firebase in Your App</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>In the Firebase Console, click the gear icon (⚙️) next to "Project Overview" and select "Project settings"</li>
                <li>Scroll down to "Your apps" section</li>
                <li>Click the web icon (&lt;/&gt;) to add a web app</li>
                <li>Register your app with a nickname and click "Register app"</li>
                <li>Copy the Firebase configuration object</li>
                <li>Update your src/lib/firebase/firebase.ts file with this configuration</li>
              </ol>
            </div>

            {/* CORS Configuration */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-700">6. Configure CORS for Storage (Important!)</h3>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>Install the Google Cloud SDK</li>
                <li>Run <code className="bg-gray-100 p-1 rounded">gcloud auth login</code> to authenticate</li>
                <li>Create a file named cors.json with the following content:</li>
                <li>
                  <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">
{`[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent"]
  }
]`}
                  </pre>
                </li>
                <li>Run the command: <code className="bg-gray-100 p-1 rounded">gsutil cors set cors.json gs://YOUR-BUCKET-NAME.appspot.com</code></li>
                <li>Replace YOUR-BUCKET-NAME with your actual bucket name from the Firebase Storage URL</li>
              </ol>
            </div>

            {/* Firestore Indexes */}
            <div>
              <h3 className="text-lg font-medium mb-2">7. Create Firestore Indexes (If Needed)</h3>
              <p className="mb-2 text-gray-700">If you encounter index errors, you'll need to create composite indexes:</p>
              <ol className="list-decimal ml-6 space-y-3 text-gray-700">
                <li>When you see an index error in the console, it will include a link to create the required index</li>
                <li>Click that link to be taken directly to the Firebase console with the index pre-configured</li>
                <li>Click "Create index" to create the required index</li>
                <li>Wait for the index to finish building (this can take a few minutes)</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h3 className="text-md font-medium text-blue-700 mb-2">Need Help?</h3>
            <p className="text-gray-700">
              If you encounter any issues with the setup process, please refer to the
              <a href="https://firebase.google.com/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mx-1">
                Firebase documentation
              </a>
              or contact support.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            Junior IT Hiring Manager - A comprehensive tool for managing the hiring process
          </p>
        </div>
      </footer>
    </main>
  );
} 