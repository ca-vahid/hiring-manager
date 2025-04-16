'use client';

import Link from 'next/link';
import CandidateForm from '@/app/components/CandidateForm';

export default function NewCandidatePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Add New Candidate</h1>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CandidateForm />
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