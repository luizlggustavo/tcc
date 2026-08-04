import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint4ProgressoLicoes1780700000000
  implements MigrationInterface
{
  name = 'Sprint4ProgressoLicoes1780700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conclusoes_licoes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "trilha_id" uuid NOT NULL,
        "licao_id" uuid NOT NULL,
        "concluida_em" TIMESTAMP NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conclusoes_licoes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sessoes_estudo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario_id" uuid NOT NULL,
        "trilha_id" uuid NOT NULL,
        "licao_id" uuid NOT NULL,
        "inicio_em" TIMESTAMP NOT NULL,
        "fim_em" TIMESTAMP NOT NULL,
        "duracao_segundos" integer NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessoes_estudo" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_conclusoes_licoes_usuario_licao'
        ) THEN
          ALTER TABLE "conclusoes_licoes"
          ADD CONSTRAINT "UQ_conclusoes_licoes_usuario_licao" UNIQUE ("usuario_id", "licao_id");
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_conclusoes_licoes_usuario_trilha" ON "conclusoes_licoes" ("usuario_id", "trilha_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_sessoes_estudo_usuario_periodo" ON "sessoes_estudo" ("usuario_id", "inicio_em")',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_conclusoes_licoes_usuario_id',
      'conclusoes_licoes',
      'usuario_id',
      'usuarios',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_conclusoes_licoes_trilha_id',
      'conclusoes_licoes',
      'trilha_id',
      'trilhas',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_conclusoes_licoes_licao_id',
      'conclusoes_licoes',
      'licao_id',
      'licoes',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_sessoes_estudo_usuario_id',
      'sessoes_estudo',
      'usuario_id',
      'usuarios',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_sessoes_estudo_trilha_id',
      'sessoes_estudo',
      'trilha_id',
      'trilhas',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_sessoes_estudo_licao_id',
      'sessoes_estudo',
      'licao_id',
      'licoes',
      'id',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "sessoes_estudo"');
    await queryRunner.query('DROP TABLE IF EXISTS "conclusoes_licoes"');
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
