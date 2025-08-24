import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
    date,
    numeric,
    bigint,
    primaryKey,
    boolean,
    uniqueIndex
} from 'drizzle-orm/pg-core';
import { user } from "./auth-schema"
import { FacebookIntegration, GoogleIntegration } from './workspace.validation';
export const workspaces = pgTable( "workspace", {
    id: uuid( "id" ).primaryKey().defaultRandom(),
    user_id: text( "user_id" ).notNull().references( () => user.id, { onDelete: "cascade" } ),
    name: text( "name" ).notNull(),

    facebook: jsonb( "facebook" ).$type<FacebookIntegration | null>(),
    google: jsonb( "google" ).$type<GoogleIntegration | null>(),

    updated_at: timestamp( "updated_at", { withTimezone: true } ).defaultNow(),
    created_at: timestamp( "created_at", { withTimezone: true } ).defaultNow(),
}, ( table ) => [
    uniqueIndex( 'workspaceNameUniqueIndex' ).on( table.name, table.user_id ),
], );



export const connections = pgTable( "connections", {
    id: uuid( "id" ).primaryKey().defaultRandom(),
    user_id: text( "user_id" ).notNull().references( () => user.id, { onDelete: "cascade" } ),
    provider: text( "provider" ).notNull(), // "facebook" | "google"
    provider_id: text( "provider_id" ).notNull(), // "facebook" | "google"
    access_token: text( "access_token" ).notNull(),
    refresh_token: text( "refresh_token" ),
    expires_at: timestamp( "expires_at", { withTimezone: true } ),
    meta: jsonb( "meta" ), // raw provider data (name, email, picture, etc.)
    created_at: timestamp( "created_at", { withTimezone: true } ).defaultNow(),
    updated_at: timestamp( "updated_at", { withTimezone: true } ).defaultNow(),
}, ( table ) => [
    uniqueIndex( 'uniqueConnectionPerUser' ).on( table.provider_id, table.user_id ),
], );
