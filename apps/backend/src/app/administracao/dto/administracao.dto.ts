import {
  IAtualizarCategoriaTrilha,
  IAtualizarConquista,
  IAtualizarConteudoLicao,
  IAtualizarLicao,
  IAtualizarMissao,
  IAtualizarModulo,
  IAtualizarTrilha,
  IAtualizarUsuarioAdministrativo,
  ICriarCategoriaTrilha,
  ICriarConquista,
  ICriarConteudoLicao,
  ICriarLicao,
  ICriarMissao,
  ICriarModulo,
  ICriarTrilha,
  PapelUsuario,
  StatusUsuario,
  TipoConteudoLicao,
  TipoCriterioConquista,
  TipoMissao,
} from '@tcc/interfaces';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

const PAPEIS_USUARIO: PapelUsuario[] = ['estudante', 'administrador'];
const STATUS_USUARIO: StatusUsuario[] = ['ativo', 'inativo'];
const TIPOS_CONTEUDO: TipoConteudoLicao[] = ['texto', 'video', 'pdf', 'link'];
const TIPOS_MISSAO: TipoMissao[] = ['diaria', 'semanal', 'unica'];
const TIPOS_CRITERIO_CONQUISTA: TipoCriterioConquista[] = [
  'licoes_concluidas',
  'xp_total',
  'sequencia_dias',
  'missoes_concluidas',
];

export class AtualizarUsuarioAdministrativoDto
  implements IAtualizarUsuarioAdministrativo
{
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(PAPEIS_USUARIO)
  papel?: PapelUsuario;

  @IsOptional()
  @IsIn(STATUS_USUARIO)
  status?: StatusUsuario;
}

export class CriarCategoriaTrilhaDto implements ICriarCategoriaTrilha {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string | null;
}

export class AtualizarCategoriaTrilhaDto
  implements IAtualizarCategoriaTrilha
{
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string | null;
}

export class CriarTrilhaDto implements ICriarTrilha {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  descricaoResumo: string;

  @IsUUID()
  categoriaId: string;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}

export class AtualizarTrilhaDto implements IAtualizarTrilha {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricaoResumo?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}

export class CriarModuloDto implements ICriarModulo {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

export class AtualizarModuloDto implements IAtualizarModulo {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

export class CriarLicaoDto implements ICriarLicao {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}

export class AtualizarLicaoDto implements IAtualizarLicao {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicada?: boolean;
}

export class CriarConteudoLicaoDto implements ICriarConteudoLicao {
  @IsIn(TIPOS_CONTEUDO)
  tipo: TipoConteudoLicao;

  @IsOptional()
  @IsString()
  titulo?: string | null;

  @IsOptional()
  @IsString()
  texto?: string | null;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

export class AtualizarConteudoLicaoDto implements IAtualizarConteudoLicao {
  @IsOptional()
  @IsIn(TIPOS_CONTEUDO)
  tipo?: TipoConteudoLicao;

  @IsOptional()
  @IsString()
  titulo?: string | null;

  @IsOptional()
  @IsString()
  texto?: string | null;

  @IsOptional()
  @IsString()
  url?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

export class CriarMissaoDto implements ICriarMissao {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsIn(TIPOS_MISSAO)
  tipo: TipoMissao;

  @IsInt()
  @Min(0)
  xpRecompensa: number;

  @IsString()
  @IsNotEmpty()
  objetivo: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsDateString()
  inicioEm?: string | null;

  @IsOptional()
  @IsDateString()
  fimEm?: string | null;
}

export class AtualizarMissaoDto implements IAtualizarMissao {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @IsOptional()
  @IsIn(TIPOS_MISSAO)
  tipo?: TipoMissao;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpRecompensa?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  objetivo?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsDateString()
  inicioEm?: string | null;

  @IsOptional()
  @IsDateString()
  fimEm?: string | null;
}

export class CriarConquistaDto implements ICriarConquista {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  icone: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpRecompensa?: number;

  @IsIn(TIPOS_CRITERIO_CONQUISTA)
  tipoCriterio: TipoCriterioConquista;

  @IsInt()
  @Min(1)
  valorCriterio: number;

  @IsString()
  @IsNotEmpty()
  criterio: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}

export class AtualizarConquistaDto implements IAtualizarConquista {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  descricao?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  icone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpRecompensa?: number;

  @IsOptional()
  @IsIn(TIPOS_CRITERIO_CONQUISTA)
  tipoCriterio?: TipoCriterioConquista;

  @IsOptional()
  @IsInt()
  @Min(1)
  valorCriterio?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  criterio?: string;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
