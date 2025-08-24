// src/db/workspace.validation.ts
import { z } from "zod";

export const WorkspaceCreateSchema = z.object( {
    name: z.string().min( 2, "Name is too short" ).max( 80, "Name too long" ),
} );

export const WorkspaceUpdateSchema = z.object( {
    id: z.uuid(),
    name: z.string().min( 2 ).max( 80 ).optional(),
    // add future optional fields here (phase 2): description, timezone, etc.
} );

export const WorkspaceDeleteSchema = z.object( {
    id: z.uuid(),
} );

export type FacebookIntegration = {
    connection_id?: string;
    ad_account_id?: string;
    ad_account_name?: string;
    selected_campaigns?: string[];
    selected_adsets?: string[];
    selected_ads?: string[];
};

export type GoogleIntegration = {
    connection_id?: string;
    property_id?: string;
    property_name?: string;
    // add more as you go
};