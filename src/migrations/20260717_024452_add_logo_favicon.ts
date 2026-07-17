import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ADD COLUMN "logo_id" integer;
  ALTER TABLE "settings" ADD COLUMN "favicon_id" integer;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings" ADD CONSTRAINT "settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "settings_logo_idx" ON "settings" USING btree ("logo_id");
  CREATE INDEX "settings_favicon_idx" ON "settings" USING btree ("favicon_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" DROP CONSTRAINT "settings_logo_id_media_id_fk";
  
  ALTER TABLE "settings" DROP CONSTRAINT "settings_favicon_id_media_id_fk";
  
  DROP INDEX "settings_logo_idx";
  DROP INDEX "settings_favicon_idx";
  ALTER TABLE "settings" DROP COLUMN "logo_id";
  ALTER TABLE "settings" DROP COLUMN "favicon_id";`)
}
