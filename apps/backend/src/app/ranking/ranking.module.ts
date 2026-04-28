import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoricoXp, ProgressoUsuario, Usuario])],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
