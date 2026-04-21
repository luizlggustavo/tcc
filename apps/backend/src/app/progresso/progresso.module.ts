import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConquistasModule } from '../conquistas/conquistas.module';
import { Licao } from '../trilhas/entities/licao.entity';
import { XpModule } from '../xp/xp.module';
import { ConclusaoLicao } from './entities/conclusao-licao.entity';
import { ProgressoUsuario } from './entities/progresso-usuario.entity';
import { SessaoEstudo } from './entities/sessao-estudo.entity';
import { ProgressoService } from './progresso.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConclusaoLicao,
      Licao,
      ProgressoUsuario,
      SessaoEstudo,
    ]),
    ConquistasModule,
    XpModule,
  ],
  providers: [ProgressoService],
  exports: [ProgressoService],
})
export class ProgressoModule {}
