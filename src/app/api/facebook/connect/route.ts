// src/app/api/facebook/connect/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export async function GET( req: Request ) {
    const url = new URL( req.url );
    const workspaceId = url.searchParams.get( "workspaceId" );
    if ( !workspaceId ) return NextResponse.json( { error: "Missing workspaceId" }, { status: 400 } );

    const nonce = crypto.randomBytes( 16 ).toString( "hex" );
    ( await cookies() ).set( "fb_oauth_nonce", nonce, { httpOnly: true, sameSite: "lax", secure: true, path: "/" } );

    const state = Buffer.from( JSON.stringify( { workspaceId, nonce } ) ).toString( "base64url" );

    const fbAuthUrl = new URL( "https://www.facebook.com/v23.0/dialog/oauth" );
    fbAuthUrl.searchParams.set( "client_id", process.env.FACEBOOK_CLIENT_ID! );
    fbAuthUrl.searchParams.set( "redirect_uri", process.env.FACEBOOK_REDIRECT_URI! ); // e.g. https://your.app/api/facebook/callback
    fbAuthUrl.searchParams.set( "response_type", "code" );
    fbAuthUrl.searchParams.set( "state", state );
    fbAuthUrl.searchParams.set( "scope", [
        "ads_read",
        "ads_management",
        "business_management",
        "email"
    ].join( "," ) );

    return NextResponse.redirect( fbAuthUrl.toString() );
}