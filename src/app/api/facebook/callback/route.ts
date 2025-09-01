// src/app/api/facebook/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
// import { facebookAccounts } from "@/db/facebook-schema";
import { getSession } from "@/lib/get-session";
import { eq } from "drizzle-orm";
import { connections, workspaces } from "@/db/workspace-schema";

async function exchangeCodeForToken( code: string ) {
    // 1) short-lived

    const u = new URL( "https://graph.facebook.com/v23.0/oauth/access_token" );
    u.searchParams.set( "client_id", process.env.FACEBOOK_CLIENT_ID! );
    u.searchParams.set( "client_secret", process.env.FACEBOOK_CLIENT_SECRET! );
    u.searchParams.set( "redirect_uri", process.env.FACEBOOK_REDIRECT_URI! );
    u.searchParams.set( "code", code );

    const shortResp = await fetch( u, { cache: "no-store" } );
    const shortJson = await shortResp.json();
    if ( !shortResp.ok ) throw new Error( shortJson.error?.message || "Token exchange failed" );

    // 2) long-lived
    const v = new URL( "https://graph.facebook.com/v23.0/oauth/access_token" );
    v.searchParams.set( "grant_type", "fb_exchange_token" );
    v.searchParams.set( "client_id", process.env.FACEBOOK_CLIENT_ID! );
    v.searchParams.set( "client_secret", process.env.FACEBOOK_CLIENT_SECRET! );
    v.searchParams.set( "fb_exchange_token", shortJson.access_token );

    const longResp = await fetch( v, { cache: "no-store" } );
    const longJson = await longResp.json();
    if ( !longResp.ok ) throw new Error( longJson.error?.message || "Long-lived token exchange failed" );

    return longJson; // { access_token, token_type, expires_in }
}


async function debugToken( accessToken: string ) {
    const appToken = `${ process.env.FACEBOOK_CLIENT_ID }|${ process.env.FACEBOOK_CLIENT_SECRET }`;
    const u = new URL( "https://graph.facebook.com/v23.0/debug_token" );
    u.searchParams.set( "input_token", accessToken );
    u.searchParams.set( "access_token", appToken );


    const r = await fetch( u, { cache: "no-store" } );
    const j = await r.json();
    if ( !r.ok ) throw new Error( j.error?.message || "debug_token failed" );

    return j.data as {
        is_valid: boolean;
        expires_at?: number;            // seconds since epoch
        data_access_expires_at?: number;
        scopes?: string[];
        type?: string;                  // "USER" / "PAGE"
    };
}
async function fetchMe( access_token: string ) {
    const meResp = await fetch( `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${ access_token }`, {
        cache: "no-store",
    } );
    const me = await meResp.json();
    if ( !meResp.ok ) throw new Error( me.error?.message || "Failed to fetch me" );
    return me as { id: string; name: string, email: string };
}

export async function GET( req: Request ) {
    const session = await getSession();
    if ( !session ) {
        return NextResponse.redirect( new URL( "/sign-in", req.url ) );
    }

    const url = new URL( req.url );
    const code = url.searchParams.get( "code" );
    const state = url.searchParams.get( "state" );
    if ( !code || !state ) {
        return NextResponse.redirect( new URL( "/?error=fb_missing_code", req.url ) );
    }

    // validate state / nonce
    const parsed = JSON.parse( Buffer.from( state, "base64url" ).toString( "utf8" ) ) as { workspaceId: string; nonce: string };

    const nonceCookie = ( await cookies() ).get( "fb_oauth_nonce" )?.value;
    ( await cookies() ).set( "fb_oauth_nonce", "", { path: "/", expires: new Date( 0 ) } ); // clear
    if ( !nonceCookie || nonceCookie !== parsed.nonce ) {
        return NextResponse.redirect( new URL( "/?error=fb_state_mismatch", req.url ) );
    }

    // 1) exchange code → long-lived token
    const token = await exchangeCodeForToken( code );
    const dbg = await debugToken( token.access_token );
    // 2) fetch profile
    const me = await fetchMe( token.access_token );

    // 3) upsert account
    const expiresAt =
        dbg.expires_at && dbg.expires_at > 0 ? new Date( dbg.expires_at * 1000 ) : null;
    const dataAccessExpiresAt = dbg.data_access_expires_at
        ? new Date( dbg.data_access_expires_at * 1000 )
        : null;


    const connectionResult = await db
        .insert( connections )
        .values( {
            provider_id: me.id,
            user_id: session.user.id,
            provider: 'facebook',
            access_token: token.access_token,
            expires_at: expiresAt,
            meta: {
                display_name: me.name,
                email: me.email,
                picture_url: `https://graph.facebook.com/${ me.id }/picture?type=large`,
                data_access_expires_at: dataAccessExpiresAt?.toISOString() ?? undefined,
            },

        } )
        .onConflictDoUpdate( {
            target: [ connections.provider_id, connections.user_id ],
            set: {
                access_token: token.access_token,
                updated_at: new Date(),
                expires_at: expiresAt,
                meta: {
                    display_name: me.name,
                    email: me.email,
                    picture_url: `https://graph.facebook.com/${ me.id }/picture?type=large`,
                    data_access_expires_at: dataAccessExpiresAt?.toISOString() ?? undefined,

                },
            },
        } )
        .returning( { id: connections.id } );;

    const connectionId = connectionResult[ 0 ].id;
    // 4) upsert workspace

    await db
        .update( workspaces )
        .set( {
            facebook: {
                connection_id: connectionId
            }
        } )
        .where( eq( workspaces.id, parsed.workspaceId ) );
    // back to the workspace integrations
    return NextResponse.redirect( new URL( `/w/${ parsed.workspaceId }/integrations?connected=1`, req.url ) );
}