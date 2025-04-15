import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministracaoModule } from './administracao/administracao.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PapeisGuard } from './auth/guards/papeis.guard';
import { ConquistasModule } from './conquistas/conquistas.module';
import { EstatisticasModule } from './estatisticas/estatisticas.module';
import { MissoesModule } from './missoes/missoes.module';
import { ProgressoModule } from './progresso/progresso.module';
import { RankingModule } from './ranking/ranking.module';
import { TrilhasModule } from './trilhas/trilhas.module';
import { UsuarioModule } from './usuario/usuario.module';
import { XpModule } from './xp/xp.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/backend/.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '/../**/*.entity.{js,ts}'],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    AdministracaoModule,
    AuthModule,
    ConquistasModule,
    EstatisticasModule,
    MissoesModule,
    ProgressoModule,
    RankingModule,
    TrilhasModule,
    UsuarioModule,
    XpModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
})
export class AppModule {}
