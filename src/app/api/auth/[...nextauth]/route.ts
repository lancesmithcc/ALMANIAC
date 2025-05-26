import NextAuth, { AuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsername } from '@/lib/database'; // Use this instead of local definition
import bcrypt from 'bcryptjs';
import { User } from '@/types'; // Our User type

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
  secret: process.env.NEXTAUTH_SECRET, // MUST be set in .env.local and Netlify
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 