'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get callbackUrl from query parameters, default to home page
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Display error message if redirected from signIn with an error
  useEffect(() => {
    const signInError = searchParams.get('error');
    if (signInError) {
      // You can map error codes to user-friendly messages here
      if (signInError === 'CredentialsSignin') {
        setError('Invalid username or password. Please try again.');
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username || !password) {
      setError('Username and password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually to show errors on this page
        username,
        password,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid username or password. Please try again.');
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
      } else if (result?.ok) {
        // Successful login, redirect to callbackUrl or dashboard
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login submit error:', err);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image 
            src="/almaniaclogo.svg" 
            alt="Almaniac Logo" 
            width={64}
            height={64}
            className="mb-4" 
          />
          <h1 className="text-3xl font-bold text-center text-green-400">Log In to Almaniac</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-green-400 hover:text-green-300">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 