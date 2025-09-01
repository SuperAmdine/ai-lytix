import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
    date,
    numeric,
    bigint,
    primaryKey,
    boolean,
    uniqueIndex
} from 'drizzle-orm/pg-core';

export const facebookAdAccounts = pgTable( "facebook_ad_accounts", {
    ad_account_id: text( "ad_account_id" ).primaryKey(), // act_123456
    provider_id: text( "provider_id" ).notNull(),
    name: text( "name" ),
    currency: text( "currency" ),
    timezone_name: text( "timezone_name" ),
    last_synced_at: timestamp( "last_synced_at", { withTimezone: true } ).notNull(),
    updated_at: timestamp( "updated_at", { withTimezone: true } ).notNull(),
    created_at: timestamp( "created_at", { withTimezone: true } ).defaultNow(),
} )



/* ===========================
   FACEBOOK SYNC STATE
   =========================== */
export const facebookSyncState = pgTable( "facebook_sync_state", {
    ad_account_id: text( "ad_account_id" ).primaryKey(),
    ad_accounts_last_synced: timestamp( "ad_accounts_last_synced", { withTimezone: true } ),
    campaigns_last_synced: timestamp( "campaigns_last_synced", { withTimezone: true } ),
    adsets_last_synced: timestamp( "adsets_last_synced", { withTimezone: true } ),
    ads_last_synced: timestamp( "ads_last_synced", { withTimezone: true } ),
    metrics_last_synced: timestamp( "metrics_last_synced", { withTimezone: true } ),
} );

/* ===========================
   FACEBOOK CAMPAIGNS
   =========================== */
export const facebookCampaigns = pgTable( "facebook_campaigns", {
    id: text( "id" ).primaryKey(),
    ad_account_id: text( "ad_account_id" ).notNull(),
    name: text( "name" ),
    status: text( "status" ),
    created_time: timestamp( "created_time", { withTimezone: true } ),
    updated_time: timestamp( "updated_time", { withTimezone: true } ),
    last_synced: timestamp( "last_synced", { withTimezone: true } ),
} );



/* ===========================
   FACEBOOK ADSETS
   =========================== */
export const facebookAdSets = pgTable( "facebook_adsets", {
    id: text( "id" ).primaryKey(),
    ad_account_id: text( "ad_account_id" )
        .notNull()
        .references( () => facebookAdAccounts.ad_account_id ),
    campaign_id: text( "campaign_id" )
        .notNull()
        .references( () => facebookCampaigns.id ),
    name: text( "name" ),
    status: text( "status" ),
    created_time: timestamp( "created_time", { withTimezone: true } ),
    updated_time: timestamp( "updated_time", { withTimezone: true } ),
    last_synced: timestamp( "last_synced", { withTimezone: true } ),
} );

/* ===========================
   FACEBOOK ADS
   =========================== */
export const facebookAds = pgTable( "facebook_ads", {
    id: text( "id" ).primaryKey(),
    ad_account_id: text( "ad_account_id" ).notNull(),
    campaign_id: text( "campaign_id" ).notNull(), // denormalized for speed
    adset_id: text( "adset_id" ).notNull(),
    name: text( "name" ),
    status: text( "status" ),
    created_time: timestamp( "created_time", { withTimezone: true } ),
    updated_time: timestamp( "updated_time", { withTimezone: true } ),
    last_synced: timestamp( "last_synced", { withTimezone: true } ),
} );