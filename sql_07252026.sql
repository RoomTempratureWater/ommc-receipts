CREATE TABLE "public"."deleted_records" (
    "id" UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    "record_id" VARCHAR NOT NULL,
    "record_type" VARCHAR NOT NULL,
    "record_data" JSON NOT NULL,
    "deleted_by" UUID,
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_records_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."deleted_records" ADD CONSTRAINT "deleted_records_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
