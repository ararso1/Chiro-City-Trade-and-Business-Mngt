# CCTBM Chiro Auth

Public client `cctbm-web`, issuer `https://auth.chirocity.gov.et/realms/cctbm`, audience `cctbm-api`.
Callback/logout: `https://cctbm.chirocity.gov.et/login`; web origin: `https://cctbm.chirocity.gov.et`.
Use PKCE S256, public client, standard flow. Include cctbm-api audience and client roles in access tokens.
Supported roles: ADMIN, OFFICER, FINANCE, TRADER (lowercase equivalents also accepted). The highest role wins in this order. Existing local role permissions remain authoritative.
Verified email is required. No implicit email linking: use scripts/link-keycloak-user.cjs for an explicitly authorized administrator link.
Deploy backs up PostgreSQL before additive migration. Activate Chiro Auth workflow links the specified administrator and switches production to AUTH_MODE=keycloak, disabling local password login. Existing IDs and business records are preserved.


## Automatic Chiro Auth login

In Keycloak mode, unauthenticated entries open Keycloak automatically without the middle app sign-in screen. Existing SSO sessions enter directly. Access/configuration errors show recovery controls and do not loop. Logout blocks automatic sign-in until central logout completes. Keep the existing /login redirect/logout URI and web origins; no realm or role changes are required. Explicit local authentication mode retains its local form.

## Dedicated realm

Use realm `cctbm` with `cctbm-web`, `cctbm-api`, and `cctbm-provisioner`. Keep the provisioner secret in private environment files. Restart the API after changing its environment and reload the shared Nginx proxy after container recreation.

To migrate an existing linked administrator, run `scripts/link-keycloak-user.cjs` from the backend with `LINK_EMAIL`, `KEYCLOAK_SUB`, `KEYCLOAK_REALM`, `PREVIOUS_KEYCLOAK_SUB`, and `PREVIOUS_KEYCLOAK_ISSUER` set. The previous identity must match exactly. This preserves the local ID and permissions; ordinary requests never link accounts by email.
