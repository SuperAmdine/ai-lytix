// fb_ad_daily.ts
import {
    pgTable, text, date, bigint, numeric, timestamp, primaryKey, index, jsonb
} from 'drizzle-orm/pg-core';
import { facebookAds, facebookAdSets, facebookCampaigns, facebookAdAccounts } from './facebook-schema';

export const fbAdDaily = pgTable(
    'fb_ad_daily',
    {
        ad_id: text( 'ad_id' )
            .notNull()
            .references( () => facebookAds.id, { onDelete: 'cascade' } ),

        adset_id: text( 'adset_id' )
            .notNull()
            .references( () => facebookAdSets.id, { onDelete: 'cascade' } ),

        campaign_id: text( 'campaign_id' )
            .notNull()
            .references( () => facebookCampaigns.id, { onDelete: 'cascade' } ),

        ad_account_id: text( 'ad_account_id' )
            .notNull()
            .references( () => facebookAdAccounts.ad_account_id, { onDelete: 'cascade' } ),

        date: date( 'date' ).notNull(),                       // YYYY-MM-DD (account timezone)
        attribution: text( 'attribution' ).notNull(),        // e.g. 'default', '7d_click_1d_view'

        // minimal additive bases
        impressions: bigint( 'impressions', { mode: 'number' } ).notNull().default( 0 ),
        clicks: bigint( 'clicks', { mode: 'number' } ).notNull().default( 0 ),
        link_clicks: bigint( 'link_clicks', { mode: 'number' } ).notNull().default( 0 ),
        spend: numeric( 'spend', { precision: 18, scale: 6 } ).notNull().default( '0' ),

        // optional “catch-all” for future long-tail fields you might fetch ad-hoc
        extras: jsonb( 'extras' ),

        last_synced: timestamp( 'last_synced', { withTimezone: true } ).notNull().defaultNow(),
    },
    ( t ) => [
        primaryKey( { columns: [ t.ad_id, t.date, t.attribution ] } ),

        // helpful roll-up indexes
        index( 'fb_ad_daily_adset_date' ).on( t.adset_id, t.date ),
        index( 'fb_ad_daily_campaign_date' ).on( t.campaign_id, t.date ),
        index( 'fb_ad_daily_acct_date' ).on( t.ad_account_id, t.date ),
    ] )