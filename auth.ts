import { ObjectId } from "mongodb";
import { NextResponse } from 'next/server';
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { UserRole, isAdminAccount, isSuperAdminAccount } from "@/lib/models/UserRole";

// Add environment variable check
const checkEnvVariables = () => {
    const requiredVars = [
        'AUTH_GOOGLE_ID',
        'AUTH_GOOGLE_SECRET',
        'AUTH_SECRET',
        'NEXTAUTH_SECRET',
        'MONGODB_URI',
        'MONGODB_DB'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        NextResponse.json({ warning: `Missing the following environment variables: ${missingVars.join(', ')}` }, { status: 200 });

        // Check critical variables
        if (missingVars.includes('AUTH_SECRET') && missingVars.includes('NEXTAUTH_SECRET')) {
            NextResponse.json({ error: 'AUTH_SECRET and NEXTAUTH_SECRET environment variables are not set, which may cause authentication issues' }, { status: 200 });
            // Auto-set dev key in development environment
            if (process.env.NODE_ENV === 'development') {
                process.env.NEXTAUTH_SECRET = 'development-secret-do-not-use-in-production';
                NextResponse.json({ warning: 'Temporary NEXTAUTH_SECRET set for development, do not use in production' }, { status: 200 });
            }
        }

        if (missingVars.includes('AUTH_GOOGLE_ID') || missingVars.includes('AUTH_GOOGLE_SECRET')) {
            NextResponse.json({ error: 'Google OAuth configuration is incomplete, Google login may be unavailable' }, { status: 200 });
        }

        if (missingVars.includes('MONGODB_URI') || missingVars.includes('MONGODB_DB')) {
            NextResponse.json({ error: 'MongoDB configuration is incomplete, user data may not be stored correctly' }, { status: 200 });
        }
    }

    // Check if NEXTAUTH_URL is set correctly
    if (!process.env.NEXTAUTH_URL && typeof window === 'undefined') {
        NextResponse.json({ warning: 'NEXTAUTH_URL environment variable is not set, which may cause callback URL issues' }, { status: 200 });

        // Try to set default value in development environment
        if (process.env.NODE_ENV === 'development') {
            process.env.NEXTAUTH_URL = 'http://localhost:3000';
            NextResponse.json({ warning: 'Set default NEXTAUTH_URL=http://localhost:3000 in development environment' }, { status: 200 });
        }
    }
};

// Check environment variables on server side
if (typeof window === 'undefined') {
    checkEnvVariables();
}

// Add detailed logging utility
const logAuth = (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG_AUTH === "true") {
        NextResponse.json({ message: `[Auth] ${message}` }, { status: 200 });
        if (error) {
            // Safely handle different error parameter types
            try {
                if (Array.isArray(error)) {
                    // Handle array-type error parameters
                    NextResponse.json({
                        error: `[Auth Error] ` + error.map(item =>
                            typeof item === 'object' && item !== null
                                ? JSON.stringify(item, Object.getOwnPropertyNames(item))
                                : item
                        ).join(', ')
                    }, { status: 200 });
                } else if (error instanceof Error) {
                    // Handle standard Error object
                    NextResponse.json({ error: `[Auth Error] ${error.name}: ${error.message}` }, { status: 200 });
                    if (error.stack) {
                        NextResponse.json({ error: `[Auth Stack] ${error.stack}` }, { status: 200 });
                    }
                } else if (typeof error === 'object' && error !== null) {
                    // Handle general objects
                    NextResponse.json({ error: `[Auth Error] ` + JSON.stringify(error, Object.getOwnPropertyNames(error)) }, { status: 200 });
                } else {
                    // Handle primitive types
                    NextResponse.json({ error: `[Auth Error] ` + error }, { status: 200 });
                }
            } catch (logError) {
                // Avoid errors caused by logging itself
                NextResponse.json({ error: `[Auth Error] Failed to log error: ${logError instanceof Error ? logError.message : 'Unknown error'}` }, { status: 200 });
            }
        }
    }
};

// Strategy: Execute database and authentication related code only on the server side
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adapter: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let bcryptCompare: any = null;

// Use static configuration to avoid client-side imports of server-side dependencies
export const config = {
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID || "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            },
            // Add check for Google ID token validity
            async profile(profile) {
                logAuth(`Processing Google user profile: ${profile.email}`);

                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Check if credentials are provided
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                try {
                    // Only run on server-side
                    if (typeof window === 'undefined') {
                        logAuth(`Attempting to verify user credentials: ${credentials.username}`);

                        // Dynamic import to avoid client-side import errors
                        let clientPromise;

                        try {
                            clientPromise = (await import('@/lib/mongodb')).default;
                            const bcryptjs = await import('bcryptjs');

                            bcryptCompare = bcryptjs.compare;
                        } catch (error) {
                            logAuth("MongoDB client or bcrypt import failed", error);

                            return null;
                        }

                        // Development environment default admin account
                        if (process.env.NODE_ENV === "development" &&
                            ((credentials.username === "root@amazon-frontend.com" && credentials.password === "admin123") ||
                                (credentials.username === "admin@amazon-frontend.com" && credentials.password === "admin123"))) {
                            logAuth("Logging in with development environment default admin account");

                            return {
                                id: credentials.username === "root@amazon-frontend.com" ? "root" : "admin",
                                name: credentials.username === "root@amazon-frontend.com" ? "Root Admin" : "Admin",
                                email: credentials.username,
                                role: credentials.username === "root@amazon-frontend.com" ? UserRole.SUPER_ADMIN : UserRole.ADMIN
                            };
                        }

                        let client;

                        try {
                            client = await clientPromise;
                        } catch (error) {
                            logAuth("MongoDBConnectFailed", error);

                            return null;

                        }

                        const db = client.db(process.env.MONGODB_DB || "oohunt");

                        try {
                            // Find user by email or username
                            const user = await db.collection("users").findOne({
                                $or: [
                                    { email: credentials.username },
                                    { name: credentials.username }
                                ]
                            });

                            // Check if user exists
                            if (!user) {
                                // In development, allow default account
                                if (process.env.NODE_ENV === "development" &&
                                    credentials.username === "admin" &&
                                    credentials.password === "password") {
                                    logAuth("Logging in with development environment test account");

                                    return {
                                        id: "1",
                                        name: "Admin",
                                        email: "admin@example.com",
                                        role: UserRole.ADMIN
                                    };
                                }

                                logAuth(`User does not exist: ${credentials.username}`);

                                return null;
                            }

                            // Compare passwords using bcryptjs
                            const isValid = await bcryptCompare(credentials.password, user.password);

                            if (!isValid) {
                                logAuth(`Password verification failed: ${credentials.username}`);

                                return null;
                            }

                            // update provider field if not already set
                            try {
                                if (!user.provider) {
                                    await db.collection("users").updateOne(
                                        { _id: user._id },
                                        { $set: { provider: 'credentials', lastLogin: new Date() } }
                                    );
                                    logAuth(`Updating user provider to credentials: ${user._id}`);
                                } else {
                                    // Update last login time only
                                    await db.collection("users").updateOne(
                                        { _id: user._id },
                                        { $set: { lastLogin: new Date() } }
                                    );
                                }
                            } catch (error) {
                                logAuth("Failed to update user provider info", error);
                                // continue login flow without blocking
                            }

                            logAuth(`User credentials verified successfully: ${user._id}`);

                            return {

                                id: user._id.toString(),
                                name: user.name || user.username,
                                email: user.email,
                                image: user.image,
                                role: user.role || UserRole.USER,
                                provider: user.provider || 'credentials'
                            };
                        } catch (error) {
                            logAuth("Database operation failed", error);

                            return null;
                        }
                    } else {
                        // On client-side, only check development default account
                        if (process.env.NODE_ENV === "development" &&
                            credentials.username === "admin" &&
                            credentials.password === "password") {
                            return {
                                id: "1",
                                name: "Admin",
                                email: "admin@example.com",
                                role: UserRole.ADMIN
                            };
                        }

                        return null;
                    }
                } catch (error) {
                    logAuth("Uncaught exception during user authorization", error);

                    return null;
                }
            },
        }),
    ],
    basePath: "/auth",
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
        newUser: "/auth/signup",
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn && auth.user.role && (auth.user.role === UserRole.ADMIN || auth.user.role === UserRole.SUPER_ADMIN)) {
                    return true;
                }

                return false;
            }

            return true;
        },
        async signIn({ user, account }) {
            try {
                // Handle only on server side
                if (typeof window === 'undefined' && user?.email) {
                    logAuth(`Starting user login processing: ${user.email}, provider: ${account?.provider}`);

                    let clientPromise;

                    try {

                        clientPromise = (await import('@/lib/mongodb')).default;
                    } catch (error) {
                        logAuth("MongoDB client import failed", error);
                        // In development environment, allow login without database
                        if (process.env.NODE_ENV === "development") {
                            logAuth("Allowing user to log in without database in development environment");

                            // Using temporary ID toCreate user
                            if (!user.id) {
                                user.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                            }

                            // Setting role based on user email
                            if (isSuperAdminAccount(user.email)) {
                                user.role = UserRole.SUPER_ADMIN;
                            } else if (isAdminAccount(user.email)) {
                                user.role = UserRole.ADMIN;
                            } else {
                                user.role = UserRole.USER;
                            }

                            return true;
                        }

                        return false; // Blocking login flow
                    }

                    let client;

                    try {
                        // Setting 10-second timeout
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error("MongoDB connection timed out")), 10000);
                        });

                        client = await Promise.race([
                            clientPromise,
                            timeoutPromise
                        ]);
                    } catch (error) {
                        logAuth("MongoDBConnectFailed", error);

                        // In development environment, allow login without database
                        if (process.env.NODE_ENV === "development") {
                            logAuth("Allowing user to log in without database in development environment");

                            // Using temporary ID toCreate user
                            if (!user.id) {
                                user.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                            }

                            // Setting role based on user email
                            if (isSuperAdminAccount(user.email)) {
                                user.role = UserRole.SUPER_ADMIN;
                            } else if (isAdminAccount(user.email)) {
                                user.role = UserRole.ADMIN;
                            } else {
                                user.role = UserRole.USER;
                            }

                            return true;
                        }

                        return false; // Blocking login flow
                    }

                    // The rest of the database communication code remains unchanged...
                    try {
                        const db = client.db(process.env.MONGODB_DB || "oohunt");
                        // Check if user already exists
                        const dbUser = await db.collection('users').findOne({ email: user.email });

                        if (!dbUser && account?.provider === 'google') {
                            // If new Google user, create user record
                            logAuth(`Creating new Google user: ${user.email}`);

                            let role = UserRole.USER;

                            // First check if super admin account
                            if (isSuperAdminAccount(user.email)) {
                                role = UserRole.SUPER_ADMIN;
                            }
                            // Then check if regular admin account
                            else if (isAdminAccount(user.email)) {
                                role = UserRole.ADMIN;
                            }

                            const newUser = {
                                name: user.name || user.email.split('@')[0],
                                email: user.email,
                                image: user.image || undefined,
                                role,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                lastLogin: new Date(),
                                provider: 'google'
                            };

                            const result = await db.collection('users').insertOne(newUser);

                            logAuth(`New user created successfully: ${result.insertedId.toString()}`);
                            user.id = result.insertedId.toString();
                        } else if (dbUser) {
                            // Checking if provider field needs to be updated
                            logAuth(`Updating existing user: ${dbUser._id.toString()}`);

                            const updates: {
                                lastLogin: Date;
                                updatedAt: Date;
                                provider?: string;
                            } = {
                                lastLogin: new Date(),
                                updatedAt: new Date()
                            };

                            if (account?.provider === 'google' && (!dbUser.provider || dbUser.provider !== 'google')) {
                                updates.provider = 'google';
                            } else if (!dbUser.provider) {
                                updates.provider = 'credentials';
                            }

                            // update existing user's last login time and provider
                            await db.collection('users').updateOne(
                                { _id: new ObjectId(dbUser._id) },
                                { $set: updates }
                            );
                            user.id = dbUser._id.toString();
                            logAuth(`User updated successfully: ${dbUser._id.toString()}`);
                        }
                    } catch (error) {
                        logAuth("Database operation failed", error);

                        // In development environment, allow login without database
                        if (process.env.NODE_ENV === "development") {
                            logAuth("Allowing user to log in without database in development environment");

                            // Using temporary ID toCreate user
                            if (!user.id) {
                                user.id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                            }

                            // Setting role based on user email
                            if (isSuperAdminAccount(user.email)) {
                                user.role = UserRole.SUPER_ADMIN;
                            } else if (isAdminAccount(user.email)) {
                                user.role = UserRole.ADMIN;
                            } else {
                                user.role = UserRole.USER;
                            }

                            return true;
                        }

                        return false; // Blocking login flow
                    }
                }

                return true;
            } catch (error) {
                logAuth("Login processing exception", error);

                return false; // Block login flow on any uncaught error
            }
        },
        jwt({ token, user, account }) {
            // On first login, add user info to token
            if (user) {
                logAuth(`Generating JWT: ${user.id}`);
                token.id = user.id;
                token.role = user.role || UserRole.USER;
            }

            // For Google login, check if it is a predefined admin account
            if (account && account.provider === "google" && user?.email) {
                // First check if super admin account
                if (isSuperAdminAccount(user.email)) {
                    token.role = UserRole.SUPER_ADMIN;
                    logAuth(`Google login user upgraded to super admin: ${user.email}`);
                }
                // Then check if regular admin account
                else if (isAdminAccount(user.email)) {
                    token.role = UserRole.ADMIN;
                    logAuth(`Google login user upgraded to admin: ${user.email}`);
                }
            }

            return token;
        },
        session({ session, token }) {
            if (token.id) {
                session.user.id = token.id as string;
            }

            if (token.role) {
                session.user.role = token.role as UserRole;
            }

            // Performing session validity check
            if (typeof window === 'undefined' && token.id && session.user.id) {
                logAuth(`Processing session: ${token.id}`);

                // No database check here for performance; JWT already contains required info
                // Session recovery check will be executed separately in high-security routes
            }

            return session;
        },
        async redirect({ url, baseUrl }) {
            logAuth(`Processing redirect: ${url}, baseUrl: ${baseUrl}`);

            // Detecting error page redirect loop
            if (url.includes("/auth/error")) {
                // Adding a counter in the URL to track redirect count
                const urlObj = new URL(url, baseUrl);
                const redirectCount = parseInt(urlObj.searchParams.get("redirectCount") || "0", 10);

                // If redirected more than 5 times, force redirect to home page
                if (redirectCount >= 5) {
                    logAuth(`Detected too many redirects (${redirectCount} times), forcing redirect to home page`);

                    return baseUrl;
                }

                // If redirecting to error page, add counter in URL
                urlObj.searchParams.set("redirectCount", (redirectCount + 1).toString());

                return urlObj.toString();
            }

            // Detecting login page redirect loop
            if (url.includes("/auth/signin")) {
                // If already on error or login page and redirecting to same page
                // break potential loop and redirect to home page

                const urlObj = new URL(url, baseUrl);

                if (urlObj.searchParams.has("callbackUrl") &&
                    (urlObj.searchParams.get("callbackUrl")?.includes("/auth/error") ||
                        urlObj.searchParams.get("callbackUrl")?.includes("/auth/signin"))) {
                    logAuth(`Detected potential redirect loop, forcing redirect to home page`);

                    return baseUrl;
                }
            }

            // Validate redirect URL
            if (url.startsWith(baseUrl)) {
                // Allow internal redirects
                return url;
            } else if (url.startsWith("/")) {
                // Allow relative path redirects
                return new URL(url, baseUrl).toString();
            }

            // Default redirect to home page
            logAuth(`Unsafe redirect URL: ${url}，redirecting to home page`);

            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Improve JWT secret configuration
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "development" ? "development-secret-do-not-use-in-production" : undefined),
    // remove unsafe fallback secret
    jwt: {
        // Ensure JWT has a reasonable expiration time
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Improve cookie configuration
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    debug: process.env.NODE_ENV === "development",
    logger: {
        error(code, ...message) {
            // Simplify handling, avoid complex parameter structures
            const errorMessage = `Error(${code}): ${message.join(' ')}`;

            logAuth(errorMessage);
        },
        warn(code, ...message) {
            // Simplify handling, avoid complex parameter structures
            const warnMessage = `Warning(${code}): ${message.join(' ')}`;

            logAuth(warnMessage);
        },
        debug(code, ...message) {
            if (process.env.DEBUG_AUTH === "true") {
                // Simplify handling, avoid complex parameter structures
                const debugMessage = `Debug(${code}): ${message.join(' ')}`;

                logAuth(debugMessage);
            }
        },
    },
} satisfies NextAuthConfig;

// Initialize Auth.js MongoDB adapter on server side only
if (typeof window === 'undefined') {
    const initializeAdapter = async () => {
        try {
            logAuth("Initializing MongoDB adapter");
            const { MongoDBAdapter } = await import("@auth/mongodb-adapter");

            // Improve MongoDB connection parameters, add retry and timeout configuration
            const mongodb = await import('@/lib/mongodb');
            const clientPromise = mongodb.default;

            // Test connection
            try {
                const testClient = await clientPromise;
                // Setting 30-second timeout
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("MongoDB connection test timed out")), 10000);
                });

                // Attempting ping test, using Promise.race to prevent infinite wait
                await Promise.race([
                    testClient.db().command({ ping: 1 }),
                    timeoutPromise
                ]);

                logAuth("MongoDB connection test successful");
            } catch (connError) {
                const errorMsg = "MongoDB connection test failed";

                logAuth(errorMsg, connError);

                // In development environment, do not throw error, use in-memory adapter instead
                if (process.env.NODE_ENV === "development") {
                    logAuth("In development environment, will use in-memory session storage instead of MongoDB");

                    // Do not throw error, return null to use default JWT mode
                    return;
                }

                throw new Error(errorMsg);
            }

            adapter = MongoDBAdapter(clientPromise, {
                databaseName: process.env.MONGODB_DB || "oohunt",
            }) as Adapter;

            logAuth("MongoDB adapter initialized successfully");
        } catch (adapterError) {
            logAuth("MongoDB adapter initialization failed", adapterError);
            // When adapter initialization fails, set to null without throwing error
            adapter = null;
        }
    };

    // Set up adapter during initialization
    initializeAdapter().catch((error) => {
        logAuth("Uncaught exception during MongoDB adapter initialization", error);
    });
}

// Dynamically add adapter
const authOptions = {
    ...config,
    adapter: adapter as Adapter | undefined,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions); 