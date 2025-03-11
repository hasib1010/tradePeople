// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import TempUser from "@/models/TempUser";
import bcrypt from "bcryptjs";

export const authOptions = {  // Export authOptions
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

        // Check if user exists in verified users
        const user = await User.findOne({ email: credentials.email });
        
        // If no verified user exists, check if a temporary user exists
        if (!user) {
          const tempUser = await TempUser.findOne({ email: credentials.email });
          
          // If temp user exists, it means email verification is pending
          if (tempUser) {
            throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
          }
          
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          role: user.role,
          image: user.profileImage || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.role = user.role;
        token.picture = user.image;
      }
      console.log("DEBUG: JWT Token After Callback", token);
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          firstName: token.firstName,
          role: token.role,
          image: token.picture
        };
      }
      console.log("DEBUG: Session Data", session);
      return session;
    }
  },
  
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-dont-use-this-in-production",
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };