import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressoModule } from '../progresso/progresso.module';
import { CategoriaTrilha } from './entities/categoria-trilha.entity';
import { ConteudoLicao } from './entities/conteudo-licao.entity';
import { Licao } from './entities/licao.entity';
import { ModuloTrilha } from './entities/modulo-trilha.entity';
import { Trilha } from './entities/trilha.entity';
import { TrilhasController } from './trilhas.controller';
import { TrilhasService } from './trilhas.service';

@Module({
  imports: [
    ProgressoModule,
    TypeOrmModule.forFeature([
      CategoriaTrilha,
      ConteudoLicao,
      Licao,
      ModuloTrilha,
      Trilha,
    ]),
  ],
  controllers: [TrilhasController],
  providers: [TrilhasService],
})
export class TrilhasModule {}
