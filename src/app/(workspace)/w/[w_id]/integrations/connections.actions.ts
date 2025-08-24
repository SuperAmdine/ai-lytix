// src/app/(workspace)/w/[w_id]/integrations/actions.ts
"use server";

import { db } from "@/db";
import { connections, workspaces } from "@/db/workspace-schema";
// import { facebookAccounts } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cp } from "fs";

async function ensureAuth() {
    const session = await getSession();
    if ( !session ) throw new Error( "UNAUTHENTICATED" );
    return session;
}

const Rename = z.object( {
    w_id: z.string().uuid(),
    name: z.string().min( 2 ).max( 80 ),
} );

export async function renameWorkspaceAction( input: z.infer<typeof Rename> ) {
    const session = await ensureAuth();
    const parsed = Rename.safeParse( input );
    if ( !parsed.success ) return { ok: false, error: "Invalid input" };

    const { w_id, name } = parsed.data;

    const [ row ] = await db.update( workspaces )
        .set( { name: name.trim(), updated_at: new Date() } )
        .where( and( eq( workspaces.id, w_id ), eq( workspaces.user_id, session.user.id ) ) )
        .returning();

    if ( !row ) return { ok: false, error: "Not found" };
    revalidatePath( `/w/${ w_id }/integrations` );
    return { ok: true };
}

const SaveFbSelection = z.object( {
    w_id: z.string().uuid(),
    connectionId: z.string().min( 1 ),
    ad_account_id: z.string().min( 1 ), // e.g. "act_123"
} );

export async function saveFacebookSelectionAction( input: z.infer<typeof SaveFbSelection> ) {
    const session = await ensureAuth();
    const parsed = SaveFbSelection.safeParse( input );
    if ( !parsed.success ) return { ok: false, error: "Invalid input" };

    const { w_id, connectionId, ad_account_id } = parsed.data;

    // make sure this facebook account belongs to the current user
    console.log( "fb_user_id", connectionId )
    console.log( "user_id", session.user.id )
    const [ fb ] = await db.select().from( connections )
        .where( and( eq( connections.id, connectionId ), eq( connections.user_id, session.user.id ), eq( connections.provider, 'facebook' ) ) );


    if ( !fb ) return { ok: false, error: "Facebook account not found for user" };

    const [ row ] = await db
        .update( workspaces )
        .set( {
            facebook: sql`
                    COALESCE(${ workspaces.facebook }, '{}'::jsonb)
                    || ${ JSON.stringify( { ad_account_id: ad_account_id } ) }::jsonb
                `,
            updated_at: new Date(),
        } )
        .where( and( eq( workspaces.id, w_id ), eq( workspaces.user_id, session.user.id ) ) )
        .returning();

    if ( !row ) return { ok: false, error: "Workspace not found" };

    revalidatePath( `/w/${ w_id }/integrations` );
    return { ok: true };
}