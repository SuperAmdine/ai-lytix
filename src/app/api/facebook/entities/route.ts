import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { facebookCampaigns, facebookAdSets, facebookAds } from "@/db/schema";
import { and, ilike, inArray } from "drizzle-orm";

export async function GET( req: NextRequest ) {
    const { searchParams } = new URL( req.url );
    const level = String( searchParams.get( "level" ) || "campaign" );
    const q = String( searchParams.get( "q" ) || "" ).trim();
    const parentIds = String( searchParams.get( "parentIds" ) || "" ).split( "," ).filter( Boolean );
    const like = q ? `%${ q }%` : undefined;

    if ( level === "campaign" ) {
        const rows = await db.select( { id: facebookCampaigns.id, name: facebookCampaigns.name } )
            .from( facebookCampaigns )
            .where( like ? ilike( facebookCampaigns.name, like ) : undefined )
            .limit( 50 );
        return NextResponse.json( { items: rows } );
    }

    if ( level === "adset" ) {
        const rows = await db.select( { id: facebookAdSets.id, name: facebookAdSets.name } )
            .from( facebookAdSets )
            .where( and(
                like ? ilike( facebookAdSets.name, like ) : undefined,
                parentIds.length ? inArray( facebookAdSets.campaign_id, parentIds ) : undefined,
            ) )
            .limit( 50 );
        return NextResponse.json( { items: rows } );
    }

    const rows = await db.select( { id: facebookAds.id, name: facebookAds.name } )
        .from( facebookAds )
        .where( and(
            like ? ilike( facebookAds.name, like ) : undefined,
            parentIds.length ? inArray( facebookAds.adset_id, parentIds ) : undefined,
        ) )
        .limit( 50 );
    return NextResponse.json( { items: rows } );
}