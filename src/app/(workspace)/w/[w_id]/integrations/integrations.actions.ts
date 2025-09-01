// src/app/(workspace)/w/[w_id]/integrations/actions.ts
"use server";

import { db } from "@/db";
import { connections, workspaces } from "@/db/workspace-schema";
// import { facebookAccounts } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fetchFromFacebookHelper, fetchFromFacebookUrl } from "@/lib/facebook";
import { facebookAds, facebookAdSets, facebookCampaigns, facebookSyncState } from "@/db/facebook-schema";
import { fbAdDaily } from "@/db/ad-metrics";


async function ensureAuth() {
    const session = await getSession();
    if ( !session ) throw new Error( "UNAUTHENTICATED" );
    return session;
}

const Rename = z.object( {
    w_id: z.uuid(),
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
    w_id: z.uuid(),
    connectionId: z.string().min( 1 ),
    ad_account_id: z.string().min( 1 ), // e.g. "act_123"
} );

export async function saveFacebookSelectionAction( input: z.infer<typeof SaveFbSelection> ) {
    const session = await ensureAuth();
    const parsed = SaveFbSelection.safeParse( input );
    if ( !parsed.success ) return { ok: false, error: "Invalid input" };

    const { w_id, connectionId, ad_account_id } = parsed.data;

    // make sure this facebook account belongs to the current user
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


    const syncState = await db.query.facebookSyncState.findFirst( {
        where: eq( facebookSyncState.ad_account_id, ad_account_id ),
    } );
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if ( !syncState?.campaigns_last_synced || Date.now() - syncState.campaigns_last_synced.getTime() > ONE_DAY_MS ) {
        await syncFacebookCampaign( ad_account_id, fb.access_token )
    }
    if ( !syncState?.adsets_last_synced || Date.now() - syncState.adsets_last_synced.getTime() > ONE_DAY_MS ) {
        await syncFacebookAdsets( ad_account_id, fb.access_token )
    }
    if ( !syncState?.ads_last_synced || Date.now() - syncState.ads_last_synced.getTime() > ONE_DAY_MS ) {
        await syncFacebookAds( ad_account_id, fb.access_token )
    }
    if ( !syncState?.metrics_last_synced || Date.now() - syncState.metrics_last_synced.getTime() > ONE_DAY_MS ) {
        await syncFacebookAdMetrics( ad_account_id, fb.access_token )
    }

    revalidatePath( `/w/${ w_id }/integrations` );
    return { ok: true };
}


export async function syncFacebookCampaign( ad_account_id: string, access_token: string ) {

    // Get data from facebook
    let limit = 1000;
    let updatedSince: number | undefined;

    let campaignsRequest = await fetchFromFacebookHelper(
        `/${ ad_account_id }/campaigns`,
        access_token,
        {
            fields: [ "id", "name", "status", "created_time", "updated_time" ],
            limit,
            ...( updatedSince ? { updated_since: updatedSince } : {} )
        }
    );
    type FacebookCampaignApi = {
        id: string;
        name: string;
        status: string;
        created_time: string;
        updated_time: string;
    };
    let campaignsData: FacebookCampaignApi[] = campaignsRequest.data || [];

    let hasNext = campaignsRequest.paging?.next ?? null
    console.log( hasNext, campaignsRequest.data.length < limit )
    // store date in db 
    while ( hasNext ) {
        campaignsRequest = await fetchFromFacebookUrl( hasNext );
        campaignsData.push( ...( campaignsRequest.data || [] ) );
        hasNext = campaignsRequest.paging?.next ?? null;
    }
    type FacebookCampaignInsert = typeof facebookCampaigns.$inferInsert;
    const preparedCampaigns: FacebookCampaignInsert[] = campaignsData.map( ( c ) => ( {
        id: c.id,
        ad_account_id,
        name: c.name,
        status: c.status,
        created_time: c.created_time ? new Date( c.created_time ) : undefined,
        updated_time: c.updated_time ? new Date( c.updated_time ) : undefined,
        last_synced: new Date(),
    } ) );

    if ( preparedCampaigns.length > 0 ) {
        await db
            .insert( facebookCampaigns )
            .values( preparedCampaigns )
            .onConflictDoUpdate( {
                target: facebookCampaigns.id,
                set: {
                    name: sql`excluded.name`,
                    status: sql`excluded.status`,
                    updated_time: sql`excluded.updated_time`,
                    last_synced: new Date(),
                },
            } );


        await db
            .insert( facebookSyncState )
            .values( {
                ad_account_id,
                campaigns_last_synced: new Date(),
            } )
            .onConflictDoUpdate( {
                target: facebookSyncState.ad_account_id,
                set: { campaigns_last_synced: new Date() },
            } );
    }

    return { ok: true }
}
export async function syncFacebookAdsets( ad_account_id: string, access_token: string ) {

    // Get data from facebook
    let limit = 1000;
    let updatedSince: number | undefined;

    let request = await fetchFromFacebookHelper(
        `/${ ad_account_id }/adsets`,
        access_token,
        {
            fields: [ "id", "name", "status", "campaign_id", "created_time", "updated_time" ],
            limit,
            ...( updatedSince ? { updated_since: updatedSince } : {} )
        }
    );
    type FacebookAdsetApi = {
        id: string;
        name: string;
        status: string;
        created_time: string;
        updated_time: string;
        campaign_id: string;
    };



    let queryData: FacebookAdsetApi[] = request.data || [];

    let hasNext = request.paging?.next ?? null
    console.log( hasNext, request.data.length < limit )
    // store date in db 
    while ( hasNext ) {
        request = await fetchFromFacebookUrl( hasNext );
        queryData.push( ...( request.data || [] ) );
        hasNext = request.paging?.next ?? null;
    }
    type FacebookAdsetInsert = typeof facebookAdSets.$inferInsert;
    const preparedData: FacebookAdsetInsert[] = queryData.map( ( c ) => ( {
        id: c.id,
        ad_account_id,
        campaign_id: c.campaign_id,
        name: c.name,
        status: c.status,
        created_time: c.created_time ? new Date( c.created_time ) : undefined,
        updated_time: c.updated_time ? new Date( c.updated_time ) : undefined,
        last_synced: new Date(),
    } ) );

    if ( preparedData.length > 0 ) {
        await db
            .insert( facebookAdSets )
            .values( preparedData )
            .onConflictDoUpdate( {
                target: facebookAdSets.id,
                set: {
                    name: sql`excluded.name`,
                    status: sql`excluded.status`,
                    updated_time: sql`excluded.updated_time`,
                    last_synced: new Date(),
                },
            } );


        await db
            .insert( facebookSyncState )
            .values( {
                ad_account_id,
                campaigns_last_synced: new Date(),
            } )
            .onConflictDoUpdate( {
                target: facebookSyncState.ad_account_id,
                set: { adsets_last_synced: new Date() },
            } );
    }

    return { ok: true }
}
export async function syncFacebookAds( ad_account_id: string, access_token: string ) {

    // Get data from facebook
    let limit = 1000;
    let updatedSince: number | undefined;

    let request = await fetchFromFacebookHelper(
        `/${ ad_account_id }/ads`,
        access_token,
        {
            fields: [ "id", "name", "status", "campaign_id", "adset_id", "created_time", "updated_time" ],
            limit,
            ...( updatedSince ? { updated_since: updatedSince } : {} )
        }
    );
    type FacebookAdApi = {
        id: string;
        name: string;
        status: string;
        created_time: string;
        updated_time: string;
        campaign_id: string;
        adset_id: string;
    };



    let queryData: FacebookAdApi[] = request.data || [];

    let hasNext = request.paging?.next ?? null
    while ( hasNext ) {
        request = await fetchFromFacebookUrl( hasNext );
        if ( request.data !== null && request.data.length !== 0 )
            queryData = [ ...queryData, ...request.data ]
        hasNext = request.paging?.next ?? null;
    }
    queryData = queryData.filter( e => e.id !== null )
    type FacebookAdInsert = typeof facebookAds.$inferInsert;
    const preparedData: FacebookAdInsert[] = queryData.map( ( c ) => ( {
        id: c.id,
        ad_account_id,
        campaign_id: c.campaign_id,
        adset_id: c.adset_id,
        name: c.name,
        status: c.status,
        created_time: c.created_time ? new Date( c.created_time ) : undefined,
        updated_time: c.updated_time ? new Date( c.updated_time ) : undefined,
        last_synced: new Date(),
    } ) );

    if ( preparedData.length > 0 ) {


        const CHUNK_SIZE = 500; // 200–1000; tune to taste

        for ( let i = 0; i < preparedData.length; i += CHUNK_SIZE ) {
            const chunk = preparedData.slice( i, i + CHUNK_SIZE );

            await db
                .insert( facebookAds )
                .values( chunk )
                .onConflictDoUpdate( {
                    target: facebookAds.id,
                    set: {
                        name: sql`excluded.name`,
                        status: sql`excluded.status`,
                        updated_time: sql`excluded.updated_time`,
                        last_synced: sql`now()`,
                    },
                } );
        }

        await db
            .insert( facebookSyncState )
            .values( {
                ad_account_id,
                ads_last_synced: new Date(),
            } )
            .onConflictDoUpdate( {
                target: facebookSyncState.ad_account_id,
                set: { ads_last_synced: new Date() },
            } );
    }

    return { ok: true }
}
export async function syncFacebookAdMetrics( ad_account_id: string, access_token: string ) {
    let limit = 5000;
    let updatedSince: number | undefined;

    let request = await fetchFromFacebookHelper(
        `/${ ad_account_id }/insights`,
        access_token,
        {
            fields: [
                'date_start',
                'date_stop',
                'account_id',
                'campaign_id',
                'adset_id',
                'ad_id',
                'impressions',
                'clicks',
                'spend',
                'inline_link_clicks',
                'reach',
                'actions',
                'action_values' ],
            level: "ad",
            time_increment: 1, // daily
            limit,
            ...( updatedSince ? { updated_since: updatedSince } : {} )
        }
    );

    type FbAction = { action_type: string; value?: string | number };
    type FbInsightsApi = {
        date_start: string;
        date_stop: string;
        account_id: string;
        campaign_id: string;
        adset_id: string;
        ad_id: string;
        impressions?: string;
        clicks?: string;
        spend?: string;
        inline_link_clicks?: string;
        reach?: string;
        actions?: FbAction[];
        action_values?: FbAction[];
    };
    let queryData: FbInsightsApi[] = request.data || [];

    let hasNext = request.paging?.next ?? null
    while ( hasNext ) {
        request = await fetchFromFacebookUrl( hasNext );
        if ( request.data !== null && request.data.length !== 0 )
            queryData = [ ...queryData, ...request.data ]
        hasNext = request.paging?.next ?? null;
    }
    type FbAdDailyInsert = typeof fbAdDaily.$inferInsert;
    function parseNum( v: any ): number | null {
        if ( v == null ) return null;
        const n = typeof v === 'number' ? v : Number( v );
        return Number.isFinite( n ) ? n : null;
    }
    function sumAction( arr: FbAction[] | undefined, types: string[] ): number {
        if ( !arr?.length ) return 0;
        const set = new Set( types );
        let s = 0;
        for ( const a of arr ) {
            if ( set.has( a.action_type ) ) {
                const n = parseNum( a.value );
                if ( n ) s += n;
            }
        }
        return s;
    }
    const attributions = [ '7d_click', '1d_view' ] as FbAttribution[];
    const attributionKey = attributions.join( '_' ); // e.g. '7d_click_1d_view'

    const preparedData: FbAdDailyInsert[] = queryData.map( ( r ) => {
        const impressions = parseNum( r.impressions ) ?? 0;
        const clicks = parseNum( r.clicks ) ?? 0;
        const spend = parseNum( r.spend ) ?? 0;

        const linkClicksDirect = parseNum( r.inline_link_clicks );
        const linkClicksFromActions = sumAction( r.actions, [ 'link_click' ] ) || 0;
        const link_clicks = linkClicksDirect ?? linkClicksFromActions;

        const purchases = sumAction( r.actions, [ 'purchase' ] );
        const purchase_value = sumAction( r.action_values, [ 'purchase' ] );
        const leads = sumAction( r.actions, [ 'lead' ] );
        const reach = parseNum( r.reach );

        const extras: Record<string, any> = {};
        if ( reach != null ) extras.reach = reach;
        if ( purchases ) extras.purchases = purchases;
        if ( purchase_value ) extras.purchase_value = purchase_value;
        if ( leads ) extras.leads = leads;

        return {
            ad_id: r.ad_id,
            adset_id: r.adset_id,
            campaign_id: r.campaign_id,
            ad_account_id: ad_account_id,
            date: r.date_start as any,   // 'YYYY-MM-DD' in account TZ
            attribution: attributionKey,
            impressions,
            clicks,
            link_clicks: link_clicks ?? 0,
            spend: String( spend ) ?? '0',
            extras: Object.keys( extras ).length ? extras : null,
            last_synced: new Date(),
        };
    } )

    if ( preparedData.length > 0 ) {

        const CHUNK_SIZE = 500; // 200–1000; tune to taste

        for ( let i = 0; i < preparedData.length; i += CHUNK_SIZE ) {
            const chunk = preparedData.slice( i, i + CHUNK_SIZE );

            await db
                .insert( fbAdDaily )
                .values( chunk )
                .onConflictDoUpdate( {
                    target: [ fbAdDaily.ad_id, fbAdDaily.date, fbAdDaily.attribution ],
                    set: {
                        impressions: sql`excluded.impressions`,
                        clicks: sql`excluded.clicks`,
                        link_clicks: sql`excluded.link_clicks`,
                        spend: sql`excluded.spend`,
                        extras: sql`COALESCE(${ fbAdDaily.extras }, '{}'::jsonb) || COALESCE(excluded.extras, '{}'::jsonb)`,
                        last_synced: sql`now()`,
                    },
                } );
        }

        await db
            .insert( facebookSyncState )
            .values( {
                ad_account_id,
                metrics_last_synced: new Date(),
            } )
            .onConflictDoUpdate( {
                target: facebookSyncState.ad_account_id,
                set: { metrics_last_synced: new Date() },
            } );
    }

    return { ok: true }
}


type FbAttribution = '1d_view' | '7d_click' | '28d_click' | '28d_view'; // extend as you use them
