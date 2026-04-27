import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissaoUsuario } from '../missoes/entities/missao-usuario.entity';
import { ConclusaoLicao } from '../progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { ConquistasController } from './conquistas.controller';
import { ConquistasService } from './conquistas.service';
import { ConquistaUsuario } from './entities/conquista-usuario.entity';
import { Conquista } from './entities/conquista.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conquista,
      ConquistaUsuario,
      ConclusaoLicao,
      MissaoUsuario,
      ProgressoUsuario,
    ]),
  ],
  controllers: [ConquistasController],
  providers: [ConquistasService],
  exports: [ConquistasService],
})
export class ConquistasModule {}
