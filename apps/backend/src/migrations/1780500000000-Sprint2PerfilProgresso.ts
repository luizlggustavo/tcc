import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint2PerfilProgresso1780500000000
  implements MigrationInterface
{
  name = 'Sprint2PerfilProgresso1780500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "papel" character varying NOT NULL DEFAULT \'estudante\'',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "progresso_usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "xp_total" integer NOT NULL DEFAULT 0,
        "nivel" integer NOT NULL DEFAULT 1,
        "sequencia_dias" integer NOT NULL DEFAULT 0,
        "ultimo_acesso_em" TIMESTAMP,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_progresso_usuarios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_progresso_usuarios_usuario_id'
        ) THEN
          ALTER TABLE "progresso_usuarios"
          ADD CONSTRAINT "UQ_progresso_usuarios_usuario_id" UNIQUE ("usuario_id");
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_progresso_usuarios_usuario_id'
        ) THEN
          ALTER TABLE "progresso_usuarios"
          ADD CONSTRAINT "FK_progresso_usuarios_usuario_id"
          FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "progresso_usuarios"');
    await queryRunner.query('ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "papel"');
  }
}
