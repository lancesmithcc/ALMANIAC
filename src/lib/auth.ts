import { AuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsername } from '@/lib/database';
import bcrypt from 'bcryptjs';

// Generate a fallback secret for development if none is provided
const getAuthSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) {
    return secret;
  }
  
  // In development, generate a warning and use a fallback
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  NEXTAUTH_SECRET not set. Using fallback for development. Set NEXTAUTH_SECRET in production!');
    return 'dev-fallback-secret-change-in-production-' + Date.now();
  }
  
  // In production, provide a more helpful error
  console.error('❌ NEXTAUTH_SECRET environment variable is required in production!');
  console.error('📝 Please set NEXTAUTH_SECRET in your deployment environment variables.');
  console.error('🔑 Generate one with: openssl rand -base64 32');
  
  // Return a temporary secret to prevent complete failure, but log the issue
  return 'MISSING-SECRET-PLEASE-SET-NEXTAUTH_SECRET-IN-PRODUCTION';
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        try {
          const user = await getUserByUsername(credentials.username);

          if (user && user.password_hash) {
            const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
            if (isValidPassword) {
              // Return user object that NextAuth expects (must have an id)
              // We can omit password_hash here for security
              
              return { 
                id: user.id, 
                name: user.username, // NextAuth 'name' maps to our 'username'
                username: user.username, // Add this to satisfy our augmented User type
                email: user.email || '' // Provide empty string if email is null/undefined
              } as NextAuthUser; // Cast to NextAuthUser
            }
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
        return null; // Login failed
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and username to the token right after signin
      if (user) {
        token.id = user.id;
        token.username = user.username; // Use user.username (string) here
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from the token
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.username as string; // Map username back
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // We will create this page
    // error: '/auth/error', // Optional: an error page
  },
  secret: getAuthSecret(), // Use our helper function
};