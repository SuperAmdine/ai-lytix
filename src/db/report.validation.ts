// src/db/workspace.validation.ts
import { z } from "zod";

export const ReportCreateSchema = z.object( {
    name: z.string().min( 2, "Name is too short" ).max( 80, "Name too long" ),
    workspace_id: z.uuid(),


} );

export const ReportUpdateSchema = z.object( {
    id: z.uuid(),
    name: z.string().min( 2 ).max( 80 ).optional(),
    workspace_id: z.uuid(),
    // add future optional fields here (phase 2): description, timezone, etc.
} );

export const ReportDeleteSchema = z.object( {
    id: z.uuid(),
    workspace_id: z.uuid(),
} );