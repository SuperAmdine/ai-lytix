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

import { workspaces } from './workspace-schema';
export const report = pgTable( "report", {
    id: uuid( "id" ).primaryKey().defaultRandom(),
    user_id: text( "user_id" ).notNull().references( () => user.id, { onDelete: "cascade" } ),
    name: text( "name" ).notNull(),

    workspace_id: uuid( "workspace_id" ).notNull().references( () => workspaces.id, { onDelete: "cascade" } ),

    updated_at: timestamp( "updated_at", { withTimezone: true } ).defaultNow(),
    created_at: timestamp( "created_at", { withTimezone: true } ).defaultNow(),
}, ( table ) => [
    uniqueIndex( 'reportNameWorkspaceNameUniqueIndex' ).on( table.name, table.workspace_id ),
], );


