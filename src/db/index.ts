import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from "@neondatabase/serverless";

const sql = neon( process.env.DATABASE_URL! ); // HTTP driver (fast for typical queries)
export const db = drizzle( { client: sql } );