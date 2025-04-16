'use client';

import Link from 'next/link';
import FirebaseDebugger from '@/app/components/FirebaseDebugger';

export default function FirebaseDebugPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Firebase Debug</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Firebase Connection Troubleshooter</h2>
          <p className="text-gray-600">
            This tool helps diagnose issues with Firebase authentication and database access.
            Click the button below to test your Firebase connection and permissions.
          </p>
        </div>
        
        <FirebaseDebugger />
        
        <div className="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Debugging Tips</h3>
          <ul className="list-disc pl-5 text-yellow-700 space-y-2">
            <li>
              Make sure you have copied the correct Firebase rules to both Firestore Database and Storage in the Firebase Console
            </li>
            <li>
              Check that you're properly signed in (the debugger will show your authentication status)
            </li>
            <li>
              If you're signed in but still getting permission errors, your Firestore rules might not have been published yet or need a refresh
            </li>
            <li>
              For temporary testing, you can use the permissive rules (allow read, write;) but remember to switch back to authenticated rules for security
            </li>
            <li>
              Clear your browser cache and reload the application if changes don't seem to take effect
            </li>
          </ul>
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