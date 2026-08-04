import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint3TrilhasEstudante1780600000000
  implements MigrationInterface
{
  name = 'Sprint3TrilhasEstudante1780600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categorias_trilhas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying NOT NULL,
        "descricao" text,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categorias_trilhas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "trilhas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "descricao" text NOT NULL,
        "descricao_resumo" text NOT NULL,
        "publicada" boolean NOT NULL DEFAULT false,
        "categoria_id" uuid NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trilhas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "modulos_trilhas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "ordem" integer NOT NULL DEFAULT 0,
        "publicado" boolean NOT NULL DEFAULT false,
        "trilha_id" uuid NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_modulos_trilhas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "licoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "descricao" text NOT NULL,
        "ordem" integer NOT NULL DEFAULT 0,
        "publicada" boolean NOT NULL DEFAULT false,
        "modulo_id" uuid NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_licoes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conteudos_licoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tipo" character varying NOT NULL,
        "titulo" character varying,
        "texto" text,
        "url" text,
        "ordem" integer NOT NULL DEFAULT 0,
        "publicado" boolean NOT NULL DEFAULT false,
        "licao_id" uuid NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conteudos_licoes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_trilhas_publicada_titulo" ON "trilhas" ("publicada", "titulo")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_modulos_trilhas_publicado_ordem" ON "modulos_trilhas" ("trilha_id", "publicado", "ordem")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_licoes_publicada_ordem" ON "licoes" ("modulo_id", "publicada", "ordem")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_conteudos_licoes_publicado_ordem" ON "conteudos_licoes" ("licao_id", "publicado", "ordem")',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_trilhas_categoria_id'
        ) THEN
          ALTER TABLE "trilhas"
          ADD CONSTRAINT "FK_trilhas_categoria_id"
          FOREIGN KEY ("categoria_id") REFERENCES "categorias_trilhas"("id") ON DELETE RESTRICT;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_modulos_trilhas_trilha_id'
        ) THEN
          ALTER TABLE "modulos_trilhas"
          ADD CONSTRAINT "FK_modulos_trilhas_trilha_id"
          FOREIGN KEY ("trilha_id") REFERENCES "trilhas"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_licoes_modulo_id'
        ) THEN
          ALTER TABLE "licoes"
          ADD CONSTRAINT "FK_licoes_modulo_id"
          FOREIGN KEY ("modulo_id") REFERENCES "modulos_trilhas"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_conteudos_licoes_licao_id'
        ) THEN
          ALTER TABLE "conteudos_licoes"
          ADD CONSTRAINT "FK_conteudos_licoes_licao_id"
          FOREIGN KEY ("licao_id") REFERENCES "licoes"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "conteudos_licoes"');
    await queryRunner.query('DROP TABLE IF EXISTS "licoes"');
    await queryRunner.query('DROP TABLE IF EXISTS "modulos_trilhas"');
    await queryRunner.query('DROP TABLE IF EXISTS "trilhas"');
    await queryRunner.query('DROP TABLE IF EXISTS "categorias_trilhas"');
  }
}
