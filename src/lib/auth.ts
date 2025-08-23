import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import * as schema from '@/db/schema'
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth( {
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    database: drizzleAdapter( db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: { ...schema }
    } ),
    telemetry: { enabled: false },
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_LOGIN_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_LOGIN_SECRET as string,
        },
    },
    session: {
        // 30 days hard expiry; refresh ("sliding") every day on activity
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24,
        // BIG perf win: cache session payload in a short-lived signed cookie
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // cache 5 min to avoid DB reads on every getSession()
        },
    },
    plugins: [ nextCookies() ], // auto cookie handling in Server Actions/Route Handlers

} );
