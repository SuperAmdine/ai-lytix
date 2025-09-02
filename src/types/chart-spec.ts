import { z } from "zod";

export const DatePresetSchema = z.enum( [
    "last_7_days", "last_14_days", "last_30_days", "this_month", "last_month",
] );

export const ChartSpecSchema = z.object( {
    source: z.literal( "facebook" ),
    entities: z.object( {
        level: z.enum( [ "campaign", "adset", "ad" ] ).default( "campaign" ),
        scope: z.enum( [ "all", "selected" ] ).default( "all" ),
        ids: z.array( z.string() ).default( [] ), // used only when scope === "selected"
    } ),
    metric: z.object( {
        key: z.string(),                        // "impressions" | "spend" | "clicks" | "ctr" | "cpm" | "reach"
        agg: z.enum( [ "sum", "avg" ] ).default( "sum" ),
    } ),
    breakdown: z.object( {
        by: z.enum( [ "day", "campaign", "adset", "ad" ] ).default( "day" ),
    } ).default( { by: "day" } ),
    dateRange: z.object( { preset: DatePresetSchema } ).default( { preset: "last_7_days" } ),
    filters: z.array( z.object( {
        field: z.string(), op: z.enum( [ "ilike", "eq", "neq" ] ).default( "ilike" ), value: z.string(),
    } ) ).default( [] ),
    options: z.object( { yFormat: z.enum( [ "raw", "compact" ] ).default( "compact" ) } )
        .default( { yFormat: "compact" } ),
} );

export type ChartSpec = z.infer<typeof ChartSpecSchema>;

export function resolveEntityWhere( spec: ChartSpec ) {
    const lvl = spec.entities.level;
    const { scope, ids } = spec.entities;
    const key =
        lvl === "campaign" ? "campaign_id" :
            lvl === "adset" ? "adset_id" : "ad_id";
    if ( scope === "all" || ids.length === 0 ) return { key, filter: null };
    return { key, filter: { key, ids } };
}

export function rangeFromPreset( preset: z.infer<typeof DatePresetSchema> ) {
    const end = new Date();
    const start = new Date();
    if ( preset === "last_7_days" ) start.setDate( end.getDate() - 6 );
    else if ( preset === "last_14_days" ) start.setDate( end.getDate() - 13 );
    else if ( preset === "last_30_days" ) start.setDate( end.getDate() - 29 );
    else if ( preset === "this_month" ) { start.setDate( 1 ); }
    else if ( preset === "last_month" ) {
        start.setMonth( end.getMonth() - 1, 1 );
        end.setDate( 0 ); // last day of previous month
    }
    // zero time
    start.setHours( 0, 0, 0, 0 ); end.setHours( 23, 59, 59, 999 );
    return { start, end };
}