import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressoUsuario } from '../progresso/entities/progresso-usuario.entity';
import { HistoricoXp } from './entities/historico-xp.entity';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoricoXp, ProgressoUsuario])],
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
