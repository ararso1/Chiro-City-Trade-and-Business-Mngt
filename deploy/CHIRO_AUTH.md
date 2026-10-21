# CCTBM Chiro Auth

Public client `cctbm-web`, issuer `https://auth.chirocity.gov.et/realms/chirocity`, audience `cctbm-api`.
Callback/logout: `https://cctbm.chirocity.gov.et/login`; web origin: `https://cctbm.chirocity.gov.et`.
Use PKCE S256, public client, standard flow. Include cctbm-api audience and client roles in access tokens.
Supported roles: ADMIN, OFFICER, FINANCE, TRADER (lowercase equivalents also accepted). The highest role wins in this order. Existing local role permissions remain authoritative.
Verified email is required. No implicit email linking: use scripts/link-keycloak-user.cjs for an explicitly authorized administrator link.
Deploy backs up PostgreSQL before additive migration. Activate Chiro Auth workflow links the specified administrator and switches production to AUTH_MODE=keycloak, disabling local password login. Existing IDs and business records are preserved.
