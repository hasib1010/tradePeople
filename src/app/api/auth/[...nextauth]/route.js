// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          image: user.profileImage || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add user data to token
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Add token data to session
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          image: token.picture
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always allow redirects to dashboard paths
      if (url.startsWith(`${baseUrl}/dashboard/`) || 
          url.startsWith('/dashboard/')) {
        return url;
      }
      
      // Default to home page
      return baseUrl;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-dont-use-this-in-production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };