export function authConfig() {
 const mode=process.env.AUTH_MODE || 'local';
 if (!['local','keycloak'].includes(mode)) throw new Error('Invalid AUTH_MODE');
 const url=(process.env.KEYCLOAK_URL || 'https://auth.chirocity.gov.et').replace(/\/$/,'');
 const realm=process.env.KEYCLOAK_REALM || 'chirocity';
 return {mode,url,realm,clientId:process.env.KEYCLOAK_CLIENT_ID || 'cctbm-web', audience:process.env.KEYCLOAK_AUDIENCE || 'cctbm-api',issuer:url+'/realms/'+realm,requireVerifiedEmail:true};
}
