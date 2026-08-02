ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" UUID;
ALTER TABLE "refresh_tokens" ADD COLUMN "consumed_at" TIMESTAMPTZ(3);
ALTER TABLE "refresh_tokens" ADD COLUMN "family_revoked_at" TIMESTAMPTZ(3);
UPDATE "refresh_tokens" SET "family_id" = "id" WHERE "family_id" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;

ALTER TABLE "password_resets" ADD COLUMN "revoked_at" TIMESTAMPTZ(3);

CREATE UNIQUE INDEX "refresh_tokens_replaced_by_key" ON "refresh_tokens"("replaced_by");
CREATE INDEX "refresh_tokens_family_id_revoked_at_expires_at_idx" ON "refresh_tokens"("family_id", "revoked_at", "expires_at");
CREATE INDEX "password_resets_user_id_revoked_at_used_at_idx" ON "password_resets"("user_id", "revoked_at", "used_at");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_fkey" FOREIGN KEY ("replaced_by") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
