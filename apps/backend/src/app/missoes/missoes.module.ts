import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConquistasModule } from '../conquistas/conquistas.module';
import { XpModule } from '../xp/xp.module';
import { MissaoUsuario } from './entities/missao-usuario.entity';
import { Missao } from './entities/missao.entity';
import { MissoesController } from './missoes.controller';
import { MissoesService } from './missoes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Missao, MissaoUsuario]),
    ConquistasModule,
    XpModule,
  ],
  controllers: [MissoesController],
  providers: [MissoesService],
})
export class MissoesModule {}
