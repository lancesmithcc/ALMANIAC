'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface DatabaseResult {
  success: boolean;
  message: string;
  results?: Array<{
    table?: string;
    operation?: string;
    status: string;
    error?: string;
    message?: string;
    statement?: string;
  }>;
  connected?: boolean;
  error?: string;
  details?: string;
}

export default function SetupPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<DatabaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });

      const data: DatabaseResult = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to initialize database');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsInitializing(false);
    }
  };

  const fixDatabase = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fix-db', {
        method: 'POST',
      });

      const data: DatabaseResult = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to fix database');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsInitializing(false);
    }
  };

  const testConnection = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'GET',
      });

      const data: DatabaseResult = await response.json();
      setResult(data);
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Image 
            src="/almaniaclogo.svg" 
            alt="Almaniac Logo" 
            width={48}
            height={48}
            className="mr-4" 
          />
          <h1 className="text-4xl font-bold text-green-400">🛠️ Almaniac Database Setup</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Database Management</h2>
          <p className="text-gray-300 mb-6">
            Use these tools to set up or fix your database tables. If you&apos;re seeing &quot;user_id&quot; column errors, 
            use the &quot;Fix Database&quot; button to add missing columns to existing tables.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={testConnection}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium"
            >
              {isInitializing ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={initializeDatabase}
              disabled={isInitializing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Tables'}
            </button>

            <button
              onClick={fixDatabase}
              disabled={isInitializing}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium"
            >
              {isInitializing ? 'Fixing...' : 'Fix Database'}
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p><strong>Test Connection:</strong> Verify database connectivity</p>
            <p><strong>Initialize Tables:</strong> Create all tables from scratch</p>
            <p><strong>Fix Database:</strong> Add missing user_id columns to existing tables</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-green-400 font-semibold mb-4">
              {result.success ? '✅ Success' : '⚠️ Result'}
            </h3>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.success && result.results && (
              <div className="mt-4">
                <h4 className="text-white font-medium mb-2">Operations:</h4>
                <ul className="space-y-1">
                  {result.results.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className={
                        item.status === 'success' ? 'text-green-400' : 
                        item.status === 'skipped' ? 'text-yellow-400' : 'text-red-400'
                      }>
                        {item.status === 'success' ? '✅' : 
                         item.status === 'skipped' ? '⏭️' : '❌'}
                      </span>
                      <span className="ml-2">
                        {item.table || item.operation || 'Operation'} - {item.status}
                      </span>
                      {item.error && <span className="ml-2 text-red-300">- {item.error}</span>}
                      {item.message && <span className="ml-2 text-yellow-300">- {item.message}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result?.success && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mt-6">
            <h3 className="text-green-400 font-semibold mb-2">🎉 Database Ready!</h3>
            <p className="text-green-300 mb-4">
              Your database has been successfully configured. You can now:
            </p>
            <ul className="list-disc list-inside text-green-300 space-y-1">
              <li>Create user accounts</li>
              <li>Add plants and track their growth</li>
              <li>Store weather data</li>
              <li>Get AI recommendations</li>
            </ul>
            <div className="mt-4">
              <Link 
                href="/" 
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium inline-block"
              >
                Go to App →
              </Link>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">📋 Setup Checklist</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Environment variables configured in Netlify</li>
            <li>✅ App deployed successfully</li>
            <li className={result?.success ? 'text-green-400' : ''}>
              {result?.success ? '✅' : '⏳'} Database tables configured
            </li>
            <li>⏳ Test user account creation</li>
            <li>⏳ Verify all app features work</li>
          </ul>
        </div>

        <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-400 font-semibold mb-2">🔧 Troubleshooting</h3>
          <div className="text-yellow-200 space-y-2">
            <p><strong>If you see &quot;user_id column not found&quot; errors:</strong></p>
            <p>→ Click &quot;Fix Database&quot; to add missing columns to existing tables</p>
            <p><strong>If tables don&apos;t exist:</strong></p>
            <p>→ Click &quot;Initialize Tables&quot; to create all tables from scratch</p>
            <p><strong>If connection fails:</strong></p>
            <p>→ Check your database environment variables in Netlify</p>
          </div>
        </div>
      </div>
    </div>
  );
} 