'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignIn from '@/app/components/SignIn';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleAuthSuccess = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Junior IT Hiring Manager</h1>
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
            <p className="mt-2 text-gray-600">
              Please sign in to access the candidate management system
            </p>
          </div>

          <SignIn onSuccess={handleAuthSuccess} />
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