// src/app/(dashboard)/workspaces/actions.ts
"use server";

import { db } from "@/db";
import { workspaces } from "@/db/workspace-schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { WorkspaceCreateSchema, WorkspaceDeleteSchema, WorkspaceUpdateSchema } from "@/db/workspace.validation";
import { getSession } from "@/lib/get-session";

async function ensureAuth() {
    const session = await getSession();
    if ( !session ) throw new Error( "UNAUTHENTICATED" );
    return session;
};

export async function createWorkspaceAction( _: unknown, formData: FormData ) {
    const session = await ensureAuth();
    const parsed = WorkspaceCreateSchema.safeParse( {
        name: formData.get( "name" ),
    } );
    if ( !parsed.success ) {
        return { ok: false, error: parsed.error.flatten().fieldErrors.name?.[ 0 ] ?? "Invalid input" };
    }
    try {
        const [ row ] = await db
            .insert( workspaces )
            .values( {
                name: parsed.data.name.trim(),
                user_id: session.user.id,
            } )
            .returning();
        revalidatePath( "/(dashboard)" ); // your listing page
        return { ok: true, data: row };
    } catch ( e: any ) {
        // Unique (name, user_id) violation
        if ( e?.code === "23505" ) {
            return { ok: false, error: "You already have a workspace with this name." };
        }
        return { ok: false, error: "Could not create workspace." };
    }
}

export async function updateWorkspaceAction( input: {
    id: string;
    name?: string; // add more phase-2 fields later
} ) {
    const session = await ensureAuth();
    const parsed = WorkspaceUpdateSchema.safeParse( input );
    if ( !parsed.success ) return { ok: false, error: "Invalid input" };

    const { id, name } = parsed.data;

    try {
        const [ row ] = await db
            .update( workspaces )
            .set( {
                ...( name ? { name: name.trim() } : {} ),
                updated_at: new Date(),
            } )
            .where( and( eq( workspaces.id, id ), eq( workspaces.user_id, session.user.id ) ) )
            .returning();

        if ( !row ) return { ok: false, error: "Not found" };
        revalidatePath( "/(dashboard)" );
        return { ok: true, data: row };
    } catch ( e: any ) {
        if ( e?.code === "23505" ) {
            return { ok: false, error: "You already have a workspace with this name." };
        }
        return { ok: false, error: "Could not update workspace." };
    }
}

export async function deleteWorkspaceAction( _: unknown, formData: FormData ) {
    const session = await ensureAuth();
    const parsed = WorkspaceDeleteSchema.safeParse( {
        id: formData.get( "id" ),
    } );
    if ( !parsed.success ) return { ok: false, error: "Invalid input" };

    const { id } = parsed.data;

    const [ row ] = await db
        .delete( workspaces )
        .where( and( eq( workspaces.id, id ), eq( workspaces.user_id, session.user.id ) ) )
        .returning();

    if ( !row ) return { ok: false, error: "Not found" };
    revalidatePath( "/(dashboard)" );
    return { ok: true };
}