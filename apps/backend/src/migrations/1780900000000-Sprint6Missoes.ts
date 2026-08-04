import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint6Missoes1780900000000 implements MigrationInterface {
  name = 'Sprint6Missoes1780900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "missoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "descricao" text NOT NULL,
        "tipo" character varying NOT NULL,
        "xp_recompensa" integer NOT NULL,
        "objetivo" text NOT NULL,
        "ativa" boolean NOT NULL DEFAULT true,
        "inicio_em" TIMESTAMP,
        "fim_em" TIMESTAMP,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missoes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "missoes_usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "missao_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'em_andamento',
        "ciclo_referencia" character varying NOT NULL,
        "iniciado_em" TIMESTAMP,
        "concluido_em" TIMESTAMP,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missoes_usuarios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_missoes_disponibilidade" ON "missoes" ("ativa", "tipo")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_missoes_usuarios_usuario_status" ON "missoes_usuarios" ("usuario_id", "status")',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_missoes_usuarios_usuario_missao_ciclo'
        ) THEN
          ALTER TABLE "missoes_usuarios"
          ADD CONSTRAINT "UQ_missoes_usuarios_usuario_missao_ciclo"
          UNIQUE ("usuario_id", "missao_id", "ciclo_referencia");
        END IF;
      END
      $$;
    `);
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_missoes_usuarios_missao_id',
      'missoes_usuarios',
      'missao_id',
      'missoes',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_missoes_usuarios_usuario_id',
      'missoes_usuarios',
      'usuario_id',
      'usuarios',
      'id',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "missoes_usuarios"');
    await queryRunner.query('DROP TABLE IF EXISTS "missoes"');
  }

  private async adicionarChaveEstrangeira(
    queryRunner: QueryRunner,
    nome: string,
    tabela: string,
    coluna: string,
    tabelaReferencia: string,
    colunaReferencia: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = '${nome}'
        ) THEN
          ALTER TABLE "${tabela}"
          ADD CONSTRAINT "${nome}"
          FOREIGN KEY ("${coluna}") REFERENCES "${tabelaReferencia}"("${colunaReferencia}") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
  }
}
