// src/lib/auth.js
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Connect to the database
          await connectToDatabase();

          // Find the user by email
          const user = await User.findOne({ email: credentials.email });

          // If user doesn't exist or password doesn't match
          if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
            return null;
          }

          // Return the user object without the password
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.firstName + ' ' + user.lastName,
            role: user.role,
            profilePicture: user.profileImage || null,
            isVerified: user.isVerified || false
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileImage = user.profilePicture; // Change to profileImage
        token.isVerified = user.isVerified;
      }
      
      // Handle update when session is modified
      if (trigger === "update" && session?.user) {
        // Update profile image if provided
        if (session.user.profileImage) {
          token.profileImage = session.user.profileImage;
        }
  
        if (session.user.isVerified !== undefined) {
          token.isVerified = session.user.isVerified;
        }
  
        // Update first and last name if provided
        if (session.user.firstName || session.user.lastName) {
          token.name = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim();
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.profileImage = token.profileImage; // Change to profileImage
        session.user.isVerified = token.isVerified;
        session.user.name = token.name;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;