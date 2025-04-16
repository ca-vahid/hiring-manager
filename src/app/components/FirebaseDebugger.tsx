'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export default function FirebaseDebugger() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testFirestore = async () => {
    setIsLoading(true);
    setTestResults([]);
    let results: string[] = [];

    // 1. Check authentication status
    try {
      const user = auth.currentUser;
      results.push(`Authentication: ${user ? 'Signed in as ' + user.email : 'Not signed in'}`);
      
      // 2. Try to list any collection to test permissions
      try {
        results.push('Testing Firestore...');
        
        // Test read access to candidates collection with a limit
        const candidatesRef = collection(db, 'candidates');
        const q = query(candidatesRef, limit(1));
        const querySnapshot = await getDocs(q);
        
        results.push(`Firestore read access: Success (found ${querySnapshot.size} document(s))`);
        
        // If we have at least one document, show some info about it
        if (querySnapshot.size > 0) {
          const doc = querySnapshot.docs[0];
          results.push(`Sample document ID: ${doc.id}`);
          // List a few field names from the document
          const fields = Object.keys(doc.data()).slice(0, 3);
          results.push(`Sample fields: ${fields.join(', ')}${fields.length < Object.keys(doc.data()).length ? '...' : ''}`);
        }
      } catch (error: any) {
        results.push(`Firestore error: ${error.message}`);
      }
      
      // 3. Display Firebase config without sensitive information
      const configCheck = [
        'Project ID is set: ' + (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓' : '✗'),
        'Auth Domain is set: ' + (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓' : '✗'),
        'Storage Bucket is set: ' + (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓' : '✗'),
      ];
      
      results.push('Firebase Config Check:');
      results = [...results, ...configCheck];
      
    } catch (error: any) {
      results.push(`Test failed: ${error.message}`);
    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-medium mb-4">Firebase Debugger</h2>
      
      <button
        onClick={testFirestore}
        disabled={isLoading}
        className={`px-4 py-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors mb-4`}
      >
        {isLoading ? 'Testing...' : 'Test Firebase Connection'}
      </button>
      
      {testResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Test Results</h3>
          <div className="bg-gray-100 p-4 rounded-md">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  result.includes('Success') 
                    ? 'text-green-600' 
                    : result.includes('error') || result.includes('failed')
                      ? 'text-red-600'
                      : ''
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm">
        <h3 className="font-medium mb-2">Firebase Rules Reminder</h3>
        <p className="mb-2">Your Firestore and Storage rules should be set to:</p>
        <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs">
{`// Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
        </pre>
        
        <p className="mt-2 mb-2">And for Storage:</p>
        <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-xs">
{`// Storage
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
} 