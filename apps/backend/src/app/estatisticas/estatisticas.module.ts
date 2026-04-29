import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { SessaoEstudo } from '../progresso/entities/sessao-estudo.entity';
import { HistoricoXp } from '../xp/entities/historico-xp.entity';
import { AcessoUsuario } from './entities/acesso-usuario.entity';
import { EstatisticasController } from './estatisticas.controller';
import { EstatisticasService } from './estatisticas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcessoUsuario,
      ConclusaoLicao,
      HistoricoXp,
      MissaoUsuario,
      ProgressoUsuario,
      SessaoEstudo,
    ]),
  ],
  controllers: [EstatisticasController],
  providers: [EstatisticasService],
})
export class EstatisticasModule {}
