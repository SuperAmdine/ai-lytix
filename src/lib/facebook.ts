export async function fetchFromFacebookHelper( path: string, access_token: string, params: Record<string, any>, ) {

    const access_token_dev = "EAAKNyZAdgMEIBPDxqNy58ooVHlR7WlTL3s6vZBk0byHlLkZAfZC5xZBMrYyyFmBIOmikc3XF2vWD7zgnw4YSLTnumSHCJfb5UZAAERAWR8u1BQLl2tO2dxJA6ZA9ab6bONuxzhvh67od5ZAt0vw29l16yt6W9DkT5on5iIzdN7KsdUTUkp2S4MDZC8amD5Xri"
    const query = new URLSearchParams( { ...params, access_token: access_token } );

    const url = `https://graph.facebook.com/v23.0${ path }?${ query.toString() }`;
    console.log( "++", url )
    const res = await fetch( url );
    if ( !res.ok ) throw new Error( `Facebook fetch failed: ${ await res.text() } ` );

    // logFacebookQuota( url, res.headers )
    return await res.json();
}


export async function fetchFromFacebookUrl( url: string ) {
    const res = await fetch( url );
    if ( !res.ok ) throw new Error( `Facebook fetch failed: ${ await res.text() } ` );
    // logFacebookQuota( url, res.headers )
    return await res.json();
}