import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reportChart, facebookCampaigns } from "@/db/schema";
import { ChartSpecSchema } from "@/types/chart-spec";
import { eq, ilike } from "drizzle-orm";

// naive parser (deterministic). Upgrade to LLM later.
function parse( text: string ) {
    const s = text.toLowerCase();
    const intent = /add|create|make/.test( s ) ? "add_chart" : "ask";
    const metric = /(impressions|spend|clicks|ctr|cpm|reach)/.exec( s )?.[ 1 ];
    const dateRange =
        /last 14/.test( s ) ? "last_14_days" :
            /last 30/.test( s ) ? "last_30_days" :
                /this month/.test( s ) ? "this_month" :
                    /last month/.test( s ) ? "last_month" : "last_7_days";
    const breakdown =
        /by day|per day/.test( s ) ? "day" :
            /by campaign/.test( s ) ? "campaign" :
                /by adset/.test( s ) ? "adset" :
                    /by ad/.test( s ) ? "ad" : "day";
    const level =
        /campaigns?/.test( s ) ? "campaign" :
            /adsets?/.test( s ) ? "adset" :
                /ads?/.test( s ) ? "ad" : "campaign";

    // crude capture: anything after the word "for"
    const entityTerm = /for (.+)$/.exec( s )?.[ 1 ]?.replace( /by .+/, "" ).trim();

    return { intent, slots: { metric, dateRange, breakdown, level }, entityTerm };
}

export async function POST( req: NextRequest ) {
    const body = await req.json();
    const { intent, slots, entityTerm } = parse( String( body.text || "" ) );

    if ( intent !== "add_chart" ) {
        return NextResponse.json( { type: "message", message: "Try: “add chart impressions by day last 7 days for campaign X”" } );
    }

    if ( !slots.metric ) {
        return NextResponse.json( {
            type: "clarify", slot: "metric", selection: "single",
            message: "Which metric do you want?",
            choices: [ "impressions", "spend", "clicks", "ctr", "cpm", "reach" ].map( k => ( { id: k, label: k } ) ),
        } );
    }

    // Entities
    let entities: { scope: "all" | "selected"; ids: string[] } = {
        scope: "all",
        ids: [],
    };
    if ( entityTerm && entityTerm !== "all" && entityTerm !== "any" ) {
        const candidates = await db.select( { id: facebookCampaigns.id, name: facebookCampaigns.name } )
            .from( facebookCampaigns )
            .where( ilike( facebookCampaigns.name, `%${ entityTerm }%` ) )
            .limit( 10 );
        if ( candidates.length === 0 ) {
            return NextResponse.json( {
                type: "clarify",
                slot: "entities",
                selection: "multi",
                message: "I couldn't find that. Pick from recent campaigns:",
                choices: ( await db.select( { id: facebookCampaigns.id, label: facebookCampaigns.name } )
                    .from( facebookCampaigns ).limit( 10 ) ),
            } );
        }
        if ( candidates.length > 1 ) {
            return NextResponse.json( {
                type: "clarify",
                slot: "entities",
                selection: "multi",
                message: `I found ${ candidates.length } matches. Pick the ones you want:`,
                choices: candidates.map( c => ( { id: c.id, label: c.name || c.id } ) ),
            } );
        }
        // when you resolve a single match
        entities = { scope: "selected", ids: [ candidates[ 0 ].id ] };
    }

    const spec = ChartSpecSchema.parse( {
        source: "facebook",
        entities: { level: slots.level, scope: entities.scope, ids: entities.ids },
        metric: { key: slots.metric, agg: "sum" },
        breakdown: { by: slots.breakdown },
        dateRange: { preset: slots.dateRange },
        filters: [],
        options: { yFormat: "compact" },
    } );

    // Create in the given report
    const reportId = body.reportId as string;
    if ( !reportId ) return NextResponse.json( { error: "Missing reportId" }, { status: 400 } );

    const [ created ] = await db.insert( reportChart ).values( {
        report_id: reportId,
        title: `${ spec.metric.key.toUpperCase() } • ${ spec.breakdown.by } • ${ slots.dateRange.replace( /_/g, " " ) }`,
        viz_type: "line",
        spec,
    } ).returning();

    return NextResponse.json( {
        type: "action_result", action: "add_chart",
        chart: created,
        message: "Added chart to the report.",
    } );
}