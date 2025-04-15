import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'] ?? '127.0.0.1',
  port: Number(process.env['DB_PORT'] ?? 5432),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [join(__dirname, 'app/**/*.entity.{js,ts}')],
  migrations: [join(__dirname, 'migrations/**/*.{js,ts}')],
  synchronize: false,
});
