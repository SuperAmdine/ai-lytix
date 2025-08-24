export async function fetchFromFacebookHelper( path: string, access_token: string, params: Record<string, any>, ) {

    const query = new URLSearchParams( { ...params, access_token: access_token } );

    const url = `https://graph.facebook.com/v23.0/${ path }?${ query.toString() }`;
    console.log( "++", url )
    const res = await fetch( url );
    if ( !res.ok ) throw new Error( `Facebook fetch failed: ${ await res.text() } ` );

    // logFacebookQuota( url, res.headers )
    return await res.json();
}