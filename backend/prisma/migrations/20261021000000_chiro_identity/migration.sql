ALTER TABLE "User" ADD COLUMN "keycloak_sub" TEXT, ADD COLUMN "keycloak_issuer" TEXT;
CREATE UNIQUE INDEX "User_keycloak_sub_key" ON "User"("keycloak_sub");
