import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conquista } from '../conquistas/entities/conquista.entity';
import { Missao } from '../missoes/entities/missao.entity';
import { CategoriaTrilha } from '../trilhas/entities/categoria-trilha.entity';
import { ConteudoLicao } from '../trilhas/entities/conteudo-licao.entity';
import { Licao } from '../trilhas/entities/licao.entity';
import { ModuloTrilha } from '../trilhas/entities/modulo-trilha.entity';
import { Trilha } from '../trilhas/entities/trilha.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { AdministracaoController } from './administracao.controller';
import { AdministracaoService } from './administracao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoriaTrilha,
      Conquista,
      ConteudoLicao,
      Licao,
      Missao,
      ModuloTrilha,
      Trilha,
      Usuario,
    ]),
  ],
  controllers: [AdministracaoController],
  providers: [AdministracaoService],
})
export class AdministracaoModule {}
