import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint5XpNiveisHistorico1780800000000
  implements MigrationInterface
{
  name = 'Sprint5XpNiveisHistorico1780800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historicos_xp" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "quantidade" integer NOT NULL,
        "tipo_origem" character varying NOT NULL,
        "referencia_origem_id" uuid NOT NULL,
        "xp_total_apos_evento" integer NOT NULL,
        "nivel_apos_evento" integer NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historicos_xp" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_historicos_xp_usuario_periodo" ON "historicos_xp" ("usuario_id", "criado_em")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_historicos_xp_origem" ON "historicos_xp" ("tipo_origem", "referencia_origem_id")',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_historicos_xp_usuario_id'
        ) THEN
          ALTER TABLE "historicos_xp"
          ADD CONSTRAINT "FK_historicos_xp_usuario_id"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "historicos_xp"');
  }
}
