import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Papeis } from '../auth/decorators/papeis.decorator';
import { AdministracaoService } from './administracao.service';
import {
  AtualizarCategoriaTrilhaDto,
  AtualizarConquistaDto,
  AtualizarConteudoLicaoDto,
  AtualizarLicaoDto,
  AtualizarMissaoDto,
  AtualizarModuloDto,
  AtualizarTrilhaDto,
  AtualizarUsuarioAdministrativoDto,
  CriarCategoriaTrilhaDto,
  CriarConquistaDto,
  CriarConteudoLicaoDto,
  CriarLicaoDto,
  CriarMissaoDto,
  CriarModuloDto,
  CriarTrilhaDto,
} from './dto/administracao.dto';

interface RequisicaoAdministrativa {
  user: {
    id: string;
  };
}

@Papeis('administrador')
@Controller('admin')
export class AdministracaoController {
  constructor(private readonly administracaoService: AdministracaoService) {}

  @Get('usuarios')
  listarUsuarios() {
    return this.administracaoService.listarUsuarios();
  }

  @Patch('usuarios/:usuarioId')
  atualizarUsuario(
    @Req() requisicao: RequisicaoAdministrativa,
    @Param('usuarioId') usuarioId: string,
    @Body() dto: AtualizarUsuarioAdministrativoDto,
  ) {
    return this.administracaoService.atualizarUsuario(
      requisicao.user.id,
      usuarioId,
      dto,
    );
  }

  @Get('categorias-trilhas')
  listarCategorias() {
    return this.administracaoService.listarCategorias();
  }

  @Post('categorias-trilhas')
  criarCategoria(@Body() dto: CriarCategoriaTrilhaDto) {
    return this.administracaoService.criarCategoria(dto);
  }

  @Patch('categorias-trilhas/:categoriaId')
  atualizarCategoria(
    @Param('categoriaId') categoriaId: string,
    @Body() dto: AtualizarCategoriaTrilhaDto,
  ) {
    return this.administracaoService.atualizarCategoria(categoriaId, dto);
  }

  @Get('trilhas')
  listarTrilhas() {
    return this.administracaoService.listarTrilhas();
  }

  @Post('trilhas')
  criarTrilha(@Body() dto: CriarTrilhaDto) {
    return this.administracaoService.criarTrilha(dto);
  }

  @Get('trilhas/:trilhaId')
  buscarTrilha(@Param('trilhaId') trilhaId: string) {
    return this.administracaoService.buscarTrilha(trilhaId);
  }

  @Patch('trilhas/:trilhaId')
  atualizarTrilha(
    @Param('trilhaId') trilhaId: string,
    @Body() dto: AtualizarTrilhaDto,
  ) {
    return this.administracaoService.atualizarTrilha(trilhaId, dto);
  }

  @Post('trilhas/:trilhaId/modulos')
  criarModulo(
    @Param('trilhaId') trilhaId: string,
    @Body() dto: CriarModuloDto,
  ) {
    return this.administracaoService.criarModulo(trilhaId, dto);
  }

  @Patch('modulos/:moduloId')
  atualizarModulo(
    @Param('moduloId') moduloId: string,
    @Body() dto: AtualizarModuloDto,
  ) {
    return this.administracaoService.atualizarModulo(moduloId, dto);
  }

  @Post('modulos/:moduloId/licoes')
  criarLicao(@Param('moduloId') moduloId: string, @Body() dto: CriarLicaoDto) {
    return this.administracaoService.criarLicao(moduloId, dto);
  }

  @Patch('licoes/:licaoId')
  atualizarLicao(
    @Param('licaoId') licaoId: string,
    @Body() dto: AtualizarLicaoDto,
  ) {
    return this.administracaoService.atualizarLicao(licaoId, dto);
  }

  @Post('licoes/:licaoId/conteudos')
  criarConteudo(
    @Param('licaoId') licaoId: string,
    @Body() dto: CriarConteudoLicaoDto,
  ) {
    return this.administracaoService.criarConteudo(licaoId, dto);
  }

  @Patch('conteudos/:conteudoId')
  atualizarConteudo(
    @Param('conteudoId') conteudoId: string,
    @Body() dto: AtualizarConteudoLicaoDto,
  ) {
    return this.administracaoService.atualizarConteudo(conteudoId, dto);
  }

  @Get('missoes')
  listarMissoes() {
    return this.administracaoService.listarMissoes();
  }

  @Post('missoes')
  criarMissao(@Body() dto: CriarMissaoDto) {
    return this.administracaoService.criarMissao(dto);
  }

  @Patch('missoes/:missaoId')
  atualizarMissao(
    @Param('missaoId') missaoId: string,
    @Body() dto: AtualizarMissaoDto,
  ) {
    return this.administracaoService.atualizarMissao(missaoId, dto);
  }

  @Get('conquistas')
  listarConquistas() {
    return this.administracaoService.listarConquistas();
  }

  @Post('conquistas')
  criarConquista(@Body() dto: CriarConquistaDto) {
    return this.administracaoService.criarConquista(dto);
  }

  @Patch('conquistas/:conquistaId')
  atualizarConquista(
    @Param('conquistaId') conquistaId: string,
    @Body() dto: AtualizarConquistaDto,
  ) {
    return this.administracaoService.atualizarConquista(conquistaId, dto);
  }
}
