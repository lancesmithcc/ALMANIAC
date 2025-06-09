'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Database } from 'lucide-react';

export default function AdminPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const initializeDatabase = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="text-gray-400">Please log in to access admin functions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Database Administration</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Database className="h-6 w-6 mr-2 text-emerald-400" />
            Database Initialization
          </h2>
          
          <p className="text-gray-300 mb-6">
            This will create or update all database tables including the new garden management system.
            This is required after deployment to fix the missing tables causing 500 errors.
          </p>

          <button
            onClick={initializeDatabase}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <Database className="h-5 w-5 mr-2" />
            {loading ? 'Initializing Database...' : 'Initialize Database Tables'}
          </button>
        </div>

        {result && (
          <div className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
            result.success ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className="text-lg font-semibold mb-4">
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            
            {result.message && (
              <p className="text-gray-300 mb-4">{result.message}</p>
            )}

            {result.error && (
              <p className="text-red-400 mb-4">{result.error}</p>
            )}

            {result.results && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-200">Table Creation Results:</h4>
                <div className="space-y-1">
                  {result.results.map((table: any, index: number) => (
                    <div 
                      key={index}
                      className={`text-sm p-2 rounded ${
                        table.status === 'success' 
                          ? 'text-green-400 bg-green-900/20' 
                          : 'text-red-400 bg-red-900/20'
                      }`}
                    >
                      <span className="font-mono">{table.table}</span>: {table.status}
                      {table.error && <span className="ml-2 text-xs">({table.error})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 