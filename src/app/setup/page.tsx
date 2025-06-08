'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });

      const data = await response.json();

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

  const testConnection = async () => {
    setIsInitializing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'GET',
      });

      const data = await response.json();
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
        <h1 className="text-4xl font-bold mb-8 text-green-400">🛠️ Almaniac Database Setup</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Database Initialization</h2>
          <p className="text-gray-300 mb-6">
            This page helps you set up the database tables required for Almaniac to function properly.
            Click the button below to create all necessary tables.
          </p>

          <div className="space-y-4">
            <button
              onClick={testConnection}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium mr-4"
            >
              {isInitializing ? 'Testing...' : 'Test Database Connection'}
            </button>

            <button
              onClick={initializeDatabase}
              disabled={isInitializing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Database Tables'}
            </button>
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
                <h4 className="text-white font-medium mb-2">Tables Created:</h4>
                <ul className="space-y-1">
                  {result.results.map((table: any, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className={table.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                        {table.status === 'success' ? '✅' : '❌'}
                      </span>
                      <span className="ml-2">{table.table}</span>
                      {table.error && <span className="ml-2 text-red-300">- {table.error}</span>}
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
              Your database has been successfully initialized. You can now:
            </p>
            <ul className="list-disc list-inside text-green-300 space-y-1">
              <li>Create user accounts</li>
              <li>Add plants and track their growth</li>
              <li>Store weather data</li>
              <li>Get AI recommendations</li>
            </ul>
            <div className="mt-4">
              <a 
                href="/" 
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium inline-block"
              >
                Go to App →
              </a>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">📋 Setup Checklist</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Environment variables configured in Netlify</li>
            <li>✅ App deployed successfully</li>
            <li className={result?.success ? 'text-green-400' : ''}>
              {result?.success ? '✅' : '⏳'} Database tables initialized
            </li>
            <li>⏳ Test user account creation</li>
            <li>⏳ Verify all app features work</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 