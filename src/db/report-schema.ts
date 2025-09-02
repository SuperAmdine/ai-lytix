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

import { integer } from "drizzle-orm/pg-core";
import type { ChartSpec } from "@/types/chart-spec";

export const reportChart = pgTable( "report_chart", {
    id: uuid( "id" ).primaryKey().defaultRandom(),
    report_id: uuid( "report_id" ).notNull().references( () => report.id, { onDelete: "cascade" } ),
    title: text( "title" ).notNull(),
    viz_type: text( "viz_type" ).notNull(), // "line" | "bar" | "table"
    spec: jsonb( "spec" ).$type<ChartSpec>().notNull(),
    position: integer( "position" ).default( 0 ),
    width: integer( "width" ).default( 6 ),
    height: integer( "height" ).default( 3 ),
    created_at: timestamp( "created_at", { withTimezone: true } ).defaultNow(),
    updated_at: timestamp( "updated_at", { withTimezone: true } ).defaultNow(),
} );
