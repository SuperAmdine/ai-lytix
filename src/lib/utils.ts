import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn( ...inputs: ClassValue[] ) {
  return twMerge( clsx( inputs ) )
}

export function compactNumber( n: number | null | undefined ) {
  const v = Number( n ?? 0 );
  if ( !Number.isFinite( v ) ) return "0";
  return Intl.NumberFormat( undefined, { notation: "compact", maximumFractionDigits: 1 } ).format( v );
}

export function formatDateISO( d: string | Date ) {
  const s = typeof d === "string" ? d : d.toISOString();
  // assume YYYY-MM-DD or full ISO; show YYYY-MM-DD
  return s.slice( 0, 10 );
}