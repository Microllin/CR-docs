import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_mark" varchar DEFAULT 'D',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_locales" (
  	"site_name" varchar DEFAULT 'Docs' NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "settings_locales" ADD CONSTRAINT "settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "settings_locales_locale_parent_id_unique" ON "settings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_locales" CASCADE;`)
}
