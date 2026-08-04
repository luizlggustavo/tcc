import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint11PainelAdministrativo1781300000000
  implements MigrationInterface
{
  name = 'Sprint11PainelAdministrativo1781300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT \'ativo\'',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_usuarios_status_papel" ON "usuarios" ("status", "papel")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_usuarios_status_papel"');
    await queryRunner.query('ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "status"');
  }
}
