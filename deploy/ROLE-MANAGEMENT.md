# CCTBM users and permissions

Set AUTH_MODE=keycloak, KEYCLOAK_ADMIN_CLIENT_ID=cctbm-provisioner and KEYCLOAK_ADMIN_CLIENT_SECRET in backend/.env for local development or the root .env for Docker. Keep the secret server-only. Docker forwards it only to the API. The provisioner needs access to cctbm-api roles and central user/client-role management.

Apply additive migrations with `cd backend`, `npx prisma migrate deploy` and `npx prisma generate`. Do not reset or seed production data. Deployment bootstrap preserves permission choices rather than regranting default permissions. Local migrations and server configuration are applied; production changes require committing and pushing.

Open User Management, sync Chiro Auth roles, then edit permissions. Imported custom roles start empty. ADMIN, OFFICER, FINANCE and TRADER map to existing lowercase local role names. Custom role spelling is preserved. Multiple roles combine their permission grants. The migration retains existing non-admin grants and replaces the administrator wildcard with explicit grants. New local installations can configure the officer/finance/trader defaults in the editor.

Create users with a required email, temporary password and one or more roles. The app creates a disabled, email-verified central identity, assigns only cctbm-api roles, saves its local subject and enables sign-in. First login requires a password change. Existing identities are linked explicitly rather than automatically matched by email. Changing roles requires a fresh sign-in and rejects earlier tokens. Group/composite roles are managed in Keycloak when inheritance prevents role removal. Disabling a user affects CCTBM only and preserves business records.

Required administrator management grants are locked visibly in the editor; other permissions remain editable. Managers cannot delegate access beyond their own grants. Backend checks use stored permission grants for every request. These permissions control modules and actions using the existing record scope; they do not introduce trader-specific record isolation or public applicant registration.
