import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint8Conquistas1781100000000 implements MigrationInterface {
  name = 'Sprint8Conquistas1781100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conquistas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "codigo" character varying NOT NULL,
        "titulo" character varying NOT NULL,
        "descricao" text NOT NULL,
        "icone" character varying NOT NULL,
        "xp_recompensa" integer NOT NULL DEFAULT 0,
        "tipo_criterio" character varying NOT NULL,
        "valor_criterio" integer NOT NULL,
        "criterio" text NOT NULL,
        "ativa" boolean NOT NULL DEFAULT true,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conquistas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conquistas_usuarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "conquista_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "conquistado_em" TIMESTAMP NOT NULL,
        "criado_em" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conquistas_usuarios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_conquistas_codigo" ON "conquistas" ("codigo")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_conquistas_ativas_criterio" ON "conquistas" ("ativa", "tipo_criterio")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_conquistas_usuarios_usuario" ON "conquistas_usuarios" ("usuario_id")',
    );
    await this.adicionarConstraintUnica(queryRunner);
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_conquistas_usuarios_conquista_id',
      'conquistas_usuarios',
      'conquista_id',
      'conquistas',
      'id',
    );
    await this.adicionarChaveEstrangeira(
      queryRunner,
      'FK_conquistas_usuarios_usuario_id',
      'conquistas_usuarios',
      'usuario_id',
      'usuarios',
      'id',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "conquistas_usuarios"');
    await queryRunner.query('DROP TABLE IF EXISTS "conquistas"');
  }

  private async adicionarConstraintUnica(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_conquistas_usuarios_usuario_conquista'
        ) THEN
          ALTER TABLE "conquistas_usuarios"
          ADD CONSTRAINT "UQ_conquistas_usuarios_usuario_conquista"
          UNIQUE ("usuario_id", "conquista_id");
        END IF;
      END
      $$;
    `);
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
