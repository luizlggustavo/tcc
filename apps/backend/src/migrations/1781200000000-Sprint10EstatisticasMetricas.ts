import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint10EstatisticasMetricas1781200000000
  implements MigrationInterface
{
  name = 'Sprint10EstatisticasMetricas1781200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "acessos_usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "acessado_em" TIMESTAMP NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acessos_usuarios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_acessos_usuarios_usuario_periodo" ON "acessos_usuarios" ("usuario_id", "acessado_em")',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_acessos_usuarios_usuario_id'
        ) THEN
          ALTER TABLE "acessos_usuarios"
          ADD CONSTRAINT "FK_acessos_usuarios_usuario_id"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "acessos_usuarios"');
  }
}
