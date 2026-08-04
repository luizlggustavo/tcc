import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { AcessoUsuario } from '../app/estatisticas/entities/acesso-usuario.entity';
import { ConquistaUsuario } from '../app/conquistas/entities/conquista-usuario.entity';
import { Conquista } from '../app/conquistas/entities/conquista.entity';
import { ConclusaoLicao } from '../app/progresso/entities/conclusao-licao.entity';
import { ProgressoUsuario } from '../app/progresso/entities/progresso-usuario.entity';
import { SessaoEstudo } from '../app/progresso/entities/sessao-estudo.entity';
import { MissaoUsuario } from '../app/missoes/entities/missao-usuario.entity';
import { Missao } from '../app/missoes/entities/missao.entity';
import { ConteudoLicao } from '../app/trilhas/entities/conteudo-licao.entity';
import { CategoriaTrilha } from '../app/trilhas/entities/categoria-trilha.entity';
import { Licao } from '../app/trilhas/entities/licao.entity';
import { ModuloTrilha } from '../app/trilhas/entities/modulo-trilha.entity';
import { Trilha } from '../app/trilhas/entities/trilha.entity';
import { Usuario } from '../app/usuario/entities/usuario.entity';
import { HistoricoXp } from '../app/xp/entities/historico-xp.entity';

type TipoConteudoLicao = 'texto' | 'video' | 'pdf' | 'link';
type TipoMissao = 'diaria' | 'semanal' | 'unica';
type StatusMissao = 'disponivel' | 'em_andamento' | 'concluida' | 'expirada';
type TipoCriterioConquista =
  | 'licoes_concluidas'
  | 'xp_total'
  | 'sequencia_dias'
  | 'missoes_concluidas';
type TipoOrigemXp = 'conclusao_licao' | 'conclusao_missao';
type PapelUsuario = 'estudante' | 'administrador';
type StatusUsuario = 'ativo' | 'inativo';

interface CategoriaSeed {
  chave: string;
  nome: string;
  descricao: string | null;
}

interface LicaoSeed {
  chave: string;
  titulo: string;
  ordem: number;
}

interface ModuloSeed {
  chave: string;
  titulo: string;
  ordem: number;
  licoes: LicaoSeed[];
}

interface TrilhaSeed {
  chave: string;
  titulo: string;
  descricao: string;
  descricaoResumo: string;
  categoriaChave: string;
  modulos: ModuloSeed[];
}

interface MissaoSeed {
  chave: string;
  titulo: string;
  descricao: string;
  tipo: TipoMissao;
  xpRecompensa: number;
  objetivo: string;
  inicioEm: Date | null;
  fimEm: Date | null;
}

interface ConquistaSeed {
  chave: string;
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  tipoCriterio: TipoCriterioConquista;
  valorCriterio: number;
  criterio: string;
}

interface PlanoMissaoUsuario {
  missaoChave: string;
  status: StatusMissao;
  diasAtras: number;
  hora: number;
  minuto: number;
}

interface PerfilUsuarioSeed {
  chave: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: StatusUsuario;
  senha: string;
  indiceInicialLicao: number;
  quantidadeLicoes: number;
  diasEstudo: number[];
  planoMissoes: PlanoMissaoUsuario[];
}

interface EventoXpGerado {
  usuarioChave: string;
  tipoOrigem: TipoOrigemXp;
  referenciaOrigemChave: string;
  quantidade: number;
  data: Date;
}

interface RegistroConclusaoGerado {
  usuarioChave: string;
  trilhaChave: string;
  licaoChave: string;
  concluidaEm: Date;
}

interface RegistroSessaoGerado {
  usuarioChave: string;
  trilhaChave: string;
  licaoChave: string;
  inicioEm: Date;
  fimEm: Date;
  duracaoSegundos: number;
}

interface RegistroAcessoGerado {
  usuarioChave: string;
  acessadoEm: Date;
}

interface RegistroMissaoUsuarioGerado {
  id: string;
  usuarioChave: string;
  missaoChave: string;
  status: StatusMissao;
  cicloReferencia: string;
  iniciadoEm: Date | null;
  concluidoEm: Date | null;
}

interface RegistroConquistaUsuarioGerado {
  usuarioChave: string;
  conquistaChave: string;
  conquistadoEm: Date;
}

interface ResumoUsuarioGerado {
  xpTotal: number;
  nivel: number;
  sequenciaDias: number;
  ultimoAcessoEm: Date | null;
}

export class Sprint12BaseInicialTecnologia1781400000000
  implements MigrationInterface
{
  name = 'Sprint12BaseInicialTecnologia1781400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const agora = new Date();

    await queryRunner.query(`
      TRUNCATE TABLE
        "acessos_usuarios",
        "conclusoes_licoes",
        "conquistas_usuarios",
        "historicos_xp",
        "missoes_usuarios",
        "sessoes_estudo",
        "conteudos_licoes",
        "licoes",
        "modulos_trilhas",
        "trilhas",
        "progresso_usuarios",
        "conquistas",
        "missoes",
        "categorias_trilhas",
        "usuarios"
      RESTART IDENTITY CASCADE
    `);

    const categoriasSeed = this.obterCategoriasSeed();
    const trilhasSeed = this.obterTrilhasSeed();
    const missoesSeed = this.obterMissoesSeed(agora);
    const conquistasSeed = this.obterConquistasSeed();
    const perfisUsuariosSeed = this.obterPerfisUsuariosSeed();

    const categoriasPorChave = new Map<string, string>();
    const trilhasPorChave = new Map<string, string>();
    const modulosPorChave = new Map<string, { id: string; trilhaChave: string }>();
    const licoesPorChave = new Map<
      string,
      { id: string; trilhaChave: string; moduloChave: string; ordem: number }
    >();
    const missoesPorChave = new Map<string, string>();
    const conquistasPorChave = new Map<string, string>();
    const usuariosPorChave = new Map<string, string>();
    const categorias = categoriasSeed.map((categoria) => ({
      id: this.gerarUuidEstavel(`categoria:${categoria.chave}`),
      nome: categoria.nome,
      descricao: categoria.descricao,
    }));
    await queryRunner.manager.insert(CategoriaTrilha, categorias);
    for (const categoria of categoriasSeed) {
      categoriasPorChave.set(
        categoria.chave,
        this.gerarUuidEstavel(`categoria:${categoria.chave}`),
      );
    }

    const trilhas = trilhasSeed.map((trilha) => ({
      id: this.gerarUuidEstavel(`trilha:${trilha.chave}`),
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      descricaoResumo: trilha.descricaoResumo,
      publicada: true,
      categoriaId: categoriasPorChave.get(trilha.categoriaChave) as string,
    }));
    await queryRunner.manager.insert(Trilha, trilhas);
    for (const trilha of trilhasSeed) {
      trilhasPorChave.set(
        trilha.chave,
        this.gerarUuidEstavel(`trilha:${trilha.chave}`),
      );
    }

    const modulos: Array<{
      id: string;
      titulo: string;
      ordem: number;
      publicado: boolean;
      trilhaId: string;
    }> = [];
    for (const trilha of trilhasSeed) {
      for (const modulo of trilha.modulos) {
        const id = this.gerarUuidEstavel(`modulo:${modulo.chave}`);
        modulos.push({
          id,
          titulo: modulo.titulo,
          ordem: modulo.ordem,
          publicado: true,
          trilhaId: trilhasPorChave.get(trilha.chave) as string,
        });
        modulosPorChave.set(modulo.chave, {
          id,
          trilhaChave: trilha.chave,
        });
      }
    }
    await queryRunner.manager.insert(ModuloTrilha, modulos);

    const licoes: Array<{
      id: string;
      titulo: string;
      descricao: string;
      ordem: number;
      publicada: boolean;
      moduloId: string;
    }> = [];
    const licoesOrdenadas: Array<{
      chave: string;
      titulo: string;
      descricao: string;
      ordem: number;
      moduloChave: string;
      trilhaChave: string;
      trilhaTitulo: string;
      moduloTitulo: string;
    }> = [];
    for (const trilha of trilhasSeed) {
      for (const modulo of trilha.modulos) {
        for (const licao of modulo.licoes) {
          const descricao = this.criarDescricaoLicao(
            trilha.titulo,
            modulo.titulo,
            licao.titulo,
          );
          const id = this.gerarUuidEstavel(`licao:${licao.chave}`);
          licoes.push({
            id,
            titulo: licao.titulo,
            descricao,
            ordem: licao.ordem,
            publicada: true,
            moduloId: modulosPorChave.get(modulo.chave)?.id as string,
          });
          licoesOrdenadas.push({
            chave: licao.chave,
            titulo: licao.titulo,
            descricao,
            ordem: licao.ordem,
            moduloChave: modulo.chave,
            trilhaChave: trilha.chave,
            trilhaTitulo: trilha.titulo,
            moduloTitulo: modulo.titulo,
          });
          licoesPorChave.set(licao.chave, {
            id,
            trilhaChave: trilha.chave,
            moduloChave: modulo.chave,
            ordem: licao.ordem,
          });
        }
      }
    }
    await queryRunner.manager.insert(Licao, licoes);

    const conteudos = licoesOrdenadas.flatMap((licao) => {
      const tipoSecundario = this.definirTipoSecundario(licao.ordem);
      const urlSecundaria = this.obterUrlConteudo(
        licao.trilhaChave,
        tipoSecundario,
      );
      return [
        {
          id: this.gerarUuidEstavel(`conteudo:${licao.chave}:texto`),
          tipo: 'texto' as TipoConteudoLicao,
          titulo: 'Resumo da lição',
          texto: this.criarTextoConteudo(
            licao.trilhaTitulo,
            licao.moduloTitulo,
            licao.titulo,
          ),
          url: null,
          ordem: 1,
          publicado: true,
          licaoId: licoesPorChave.get(licao.chave)?.id as string,
        },
        {
          id: this.gerarUuidEstavel(
            `conteudo:${licao.chave}:${tipoSecundario}`,
          ),
          tipo: tipoSecundario,
          titulo: this.tituloConteudoSecundario(tipoSecundario),
          texto: this.textoConteudoSecundario(licao.titulo, tipoSecundario),
          url: urlSecundaria,
          ordem: 2,
          publicado: true,
          licaoId: licoesPorChave.get(licao.chave)?.id as string,
        },
      ];
    });
    await queryRunner.manager.insert(ConteudoLicao, conteudos);

    const hashSenhaEstudante = await bcrypt.hash('Senha@123', 12);
    const hashSenhaAdministrador = await bcrypt.hash('Admin@123', 12);

    const usuarios = perfisUsuariosSeed.map((perfil) => ({
      id: this.gerarUuidEstavel(`usuario:${perfil.chave}`),
      nome: perfil.nome,
      email: perfil.email,
      papel: perfil.papel,
      status: perfil.status,
      hashSenha:
        perfil.papel === 'administrador'
          ? hashSenhaAdministrador
          : hashSenhaEstudante,
    }));
    await queryRunner.manager.insert(Usuario, usuarios);
    for (const perfil of perfisUsuariosSeed) {
      usuariosPorChave.set(
        perfil.chave,
        this.gerarUuidEstavel(`usuario:${perfil.chave}`),
      );
    }

    const missoes = missoesSeed.map((missao) => ({
      id: this.gerarUuidEstavel(`missao:${missao.chave}`),
      titulo: missao.titulo,
      descricao: missao.descricao,
      tipo: missao.tipo,
      xpRecompensa: missao.xpRecompensa,
      objetivo: missao.objetivo,
      ativa: true,
      inicioEm: missao.inicioEm,
      fimEm: missao.fimEm,
    }));
    await queryRunner.manager.insert(Missao, missoes);
    for (const missao of missoesSeed) {
      missoesPorChave.set(
        missao.chave,
        this.gerarUuidEstavel(`missao:${missao.chave}`),
      );
    }

    const conquistas = conquistasSeed.map((conquista) => ({
      id: this.gerarUuidEstavel(`conquista:${conquista.chave}`),
      codigo: conquista.codigo,
      titulo: conquista.titulo,
      descricao: conquista.descricao,
      icone: conquista.icone,
      xpRecompensa: 0,
      tipoCriterio: conquista.tipoCriterio,
      valorCriterio: conquista.valorCriterio,
      criterio: conquista.criterio,
      ativa: true,
    }));
    await queryRunner.manager.insert(Conquista, conquistas);
    for (const conquista of conquistasSeed) {
      conquistasPorChave.set(
        conquista.chave,
        this.gerarUuidEstavel(`conquista:${conquista.chave}`),
      );
    }

    const registrosConclusao: RegistroConclusaoGerado[] = [];
    const registrosSessao: RegistroSessaoGerado[] = [];
    const registrosAcesso: RegistroAcessoGerado[] = [];
    const registrosMissaoUsuario: RegistroMissaoUsuarioGerado[] = [];
    const eventosXp: EventoXpGerado[] = [];
    const registrosConquista: RegistroConquistaUsuarioGerado[] = [];
    const resumoUsuarios = new Map<string, ResumoUsuarioGerado>();

    for (const perfil of perfisUsuariosSeed) {
      const usuarioId = usuariosPorChave.get(perfil.chave) as string;
      const licoesSelecionadas = licoesOrdenadas.slice(
        perfil.indiceInicialLicao,
        perfil.indiceInicialLicao + perfil.quantidadeLicoes,
      );
      const diasEstudoOrdenados = [...perfil.diasEstudo].sort((a, b) => b - a);
      const ultimoDiaEstudo =
        diasEstudoOrdenados[diasEstudoOrdenados.length - 1] ?? null;
      const acessosRegistrados = new Set<string>();

      for (let indice = 0; indice < licoesSelecionadas.length; indice += 1) {
        const licao = licoesSelecionadas[indice];
        const diasAtras =
          diasEstudoOrdenados[indice % diasEstudoOrdenados.length];
        const dataConclusao = this.criarDataRelativa(
          agora,
          diasAtras,
          8 + (indice % 4) * 2,
          (indice % 2) * 15,
        );
        const duracaoSegundos = 1200 + (indice % 4) * 300;
        const inicioSessao = new Date(
          dataConclusao.getTime() - duracaoSegundos * 1000,
        );

        registrosConclusao.push({
          usuarioChave: perfil.chave,
          trilhaChave: licao.trilhaChave,
          licaoChave: licao.chave,
          concluidaEm: dataConclusao,
        });
        registrosSessao.push({
          usuarioChave: perfil.chave,
          trilhaChave: licao.trilhaChave,
          licaoChave: licao.chave,
          inicioEm: inicioSessao,
          fimEm: dataConclusao,
          duracaoSegundos,
        });
        eventosXp.push({
          usuarioChave: perfil.chave,
          tipoOrigem: 'conclusao_licao',
          referenciaOrigemChave: licao.chave,
          quantidade: 10,
          data: dataConclusao,
        });

        const acessadoEm = this.criarDataRelativa(agora, diasAtras, 7, 45);
        const chaveAcesso = `${perfil.chave}:${this.formatarDataIso(acessadoEm)}`;
        if (!acessosRegistrados.has(chaveAcesso)) {
          registrosAcesso.push({
            usuarioChave: perfil.chave,
            acessadoEm,
          });
          acessosRegistrados.add(chaveAcesso);
        }
      }

      const planoMissoesOrdenado = [...perfil.planoMissoes].sort(
        (a, b) => a.diasAtras - b.diasAtras,
      );
      for (const planoMissao of planoMissoesOrdenado) {
        const missao = missoesSeed.find(
          (item) => item.chave === planoMissao.missaoChave,
        ) as MissaoSeed;
        const cicloReferencia = this.calcularCicloReferencia(
          missao.tipo,
          this.criarDataRelativa(
            agora,
            planoMissao.diasAtras,
            planoMissao.hora,
            planoMissao.minuto,
          ),
        );
        const idMissaoUsuario = this.gerarUuidEstavel(
          `missao-usuario:${perfil.chave}:${planoMissao.missaoChave}:${cicloReferencia}`,
        );
        const dataMissao = this.criarDataRelativa(
          agora,
          planoMissao.diasAtras,
          planoMissao.hora,
          planoMissao.minuto,
        );
        const iniciadoEm =
          planoMissao.status === 'em_andamento'
            ? dataMissao
            : new Date(dataMissao.getTime() - 45 * 60 * 1000);
        const concluidoEm =
          planoMissao.status === 'concluida'
            ? new Date(dataMissao.getTime() + 30 * 60 * 1000)
            : null;

        registrosMissaoUsuario.push({
          id: idMissaoUsuario,
          usuarioChave: perfil.chave,
          missaoChave: planoMissao.missaoChave,
          status: planoMissao.status,
          cicloReferencia,
          iniciadoEm,
          concluidoEm,
        });

        if (planoMissao.status === 'concluida') {
          eventosXp.push({
            usuarioChave: perfil.chave,
            tipoOrigem: 'conclusao_missao',
            referenciaOrigemChave: `missao-usuario:${perfil.chave}:${planoMissao.missaoChave}:${cicloReferencia}`,
            quantidade: missao.xpRecompensa,
            data: concluidoEm as Date,
          });
        }
      }

      const eventosUsuario = eventosXp
        .filter((evento) => evento.usuarioChave === perfil.chave)
        .sort((a, b) => a.data.getTime() - b.data.getTime());
      const acumulado = this.processarEventosUsuario(
        perfil,
        eventosUsuario,
        ultimoDiaEstudo !== null
          ? this.criarDataRelativa(agora, ultimoDiaEstudo, 9, 0)
          : null,
      );
      resumoUsuarios.set(usuarioId, acumulado.resumo);
      registrosConquista.push(
        ...acumulado.conquistas.map((item) => ({
          usuarioChave: perfil.chave,
          conquistaChave: item.conquistaChave,
          conquistadoEm: item.conquistadoEm,
        })),
      );
    }

    await queryRunner.manager.insert(ConclusaoLicao, registrosConclusao.map(
      (registro) => ({
        id: this.gerarUuidEstavel(
          `conclusao:${registro.usuarioChave}:${registro.licaoChave}`,
        ),
        usuarioId: usuariosPorChave.get(registro.usuarioChave) as string,
        trilhaId: trilhasPorChave.get(registro.trilhaChave) as string,
        licaoId: licoesPorChave.get(registro.licaoChave)?.id as string,
        concluidaEm: registro.concluidaEm,
      }),
    ));

    await queryRunner.manager.insert(SessaoEstudo, registrosSessao.map(
      (registro) => ({
        id: this.gerarUuidEstavel(
          `sessao:${registro.usuarioChave}:${registro.licaoChave}`,
        ),
        usuarioId: usuariosPorChave.get(registro.usuarioChave) as string,
        trilhaId: trilhasPorChave.get(registro.trilhaChave) as string,
        licaoId: licoesPorChave.get(registro.licaoChave)?.id as string,
        inicioEm: registro.inicioEm,
        fimEm: registro.fimEm,
        duracaoSegundos: registro.duracaoSegundos,
      }),
    ));

    await queryRunner.manager.insert(MissaoUsuario, registrosMissaoUsuario.map(
      (registro) => ({
        id: registro.id,
        missaoId: missoesPorChave.get(registro.missaoChave) as string,
        usuarioId: usuariosPorChave.get(registro.usuarioChave) as string,
        status: registro.status,
        cicloReferencia: registro.cicloReferencia,
        iniciadoEm: registro.iniciadoEm,
        concluidoEm: registro.concluidoEm,
      }),
    ));

    await this.ajustarHistoricosXp(queryRunner, eventosXp, usuariosPorChave, licoesPorChave, registrosMissaoUsuario);

    await queryRunner.manager.insert(AcessoUsuario, registrosAcesso.map(
      (registro) => ({
        id: this.gerarUuidEstavel(
          `acesso:${registro.usuarioChave}:${this.formatarDataIso(
            registro.acessadoEm,
          )}`,
        ),
        usuarioId: usuariosPorChave.get(registro.usuarioChave) as string,
        acessadoEm: registro.acessadoEm,
      }),
    ));

    const progressos = Array.from(usuariosPorChave.entries()).map(
      ([chaveUsuario, usuarioId]) => {
        const resumo = resumoUsuarios.get(usuarioId) ?? {
          xpTotal: 0,
          nivel: 1,
          sequenciaDias: 0,
          ultimoAcessoEm: null,
        };
        const perfil = perfisUsuariosSeed.find(
          (item) => item.chave === chaveUsuario,
        ) as PerfilUsuarioSeed;

        return {
          id: this.gerarUuidEstavel(`progresso:${chaveUsuario}`),
          usuarioId,
          xpTotal: resumo.xpTotal,
          nivel: resumo.nivel,
          sequenciaDias: perfil.papel === 'administrador' ? 0 : resumo.sequenciaDias,
          ultimoAcessoEm: resumo.ultimoAcessoEm,
        };
      },
    );
    await queryRunner.manager.insert(ProgressoUsuario, progressos);

    await queryRunner.manager.insert(ConquistaUsuario, registrosConquista.map(
      (registro) => ({
        id: this.gerarUuidEstavel(
          `conquista-usuario:${registro.usuarioChave}:${registro.conquistaChave}`,
        ),
        conquistaId: conquistasPorChave.get(registro.conquistaChave) as string,
        usuarioId: usuariosPorChave.get(registro.usuarioChave) as string,
        conquistadoEm: registro.conquistadoEm,
      }),
    ));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      TRUNCATE TABLE
        "acessos_usuarios",
        "conclusoes_licoes",
        "conquistas_usuarios",
        "historicos_xp",
        "missoes_usuarios",
        "sessoes_estudo",
        "conteudos_licoes",
        "licoes",
        "modulos_trilhas",
        "trilhas",
        "progresso_usuarios",
        "conquistas",
        "missoes",
        "categorias_trilhas",
        "usuarios"
      RESTART IDENTITY CASCADE
    `);
  }

  private obterCategoriasSeed(): CategoriaSeed[] {
    return [
      {
        chave: 'programacao-logica',
        nome: 'Programação e Lógica',
        descricao:
          'Base conceitual para raciocínio algorítmico, leitura de código e resolução de problemas.',
      },
      {
        chave: 'frontend',
        nome: 'Desenvolvimento Frontend',
        descricao:
          'Criação de interfaces, componentes, acessibilidade e experiência de uso.',
      },
      {
        chave: 'backend',
        nome: 'Desenvolvimento Backend',
        descricao:
          'APIs, regras de negócio, autenticação e integração com bancos de dados.',
      },
      {
        chave: 'dados',
        nome: 'Banco de Dados e Modelagem',
        descricao:
          'Estrutura relacional, SQL, normalização e consistência de dados.',
      },
      {
        chave: 'arquitetura',
        nome: 'Arquitetura de Software e Boas Práticas',
        descricao:
          'Organização de código, testes, observabilidade e evolução sustentável do sistema.',
      },
    ];
  }

  private obterTrilhasSeed(): TrilhaSeed[] {
    return [
      {
        chave: 'fundamentos-programacao',
        titulo: 'Fundamentos de Programação',
        descricao:
          'Trilha de entrada para quem está iniciando na área. Trabalha lógica, tipos, controle de fluxo e organização de soluções.',
        descricaoResumo:
          'Constrói a base de raciocínio necessária para começar a programar com segurança.',
        categoriaChave: 'programacao-logica',
        modulos: [
          {
            chave: 'fp-algoritmos',
            titulo: 'Pensamento Algorítmico',
            ordem: 1,
            licoes: [
              { chave: 'fp-decomposicao', titulo: 'Decomposição de problemas', ordem: 1 },
              { chave: 'fp-pseudocodigo', titulo: 'Pseudocódigo e fluxogramas', ordem: 2 },
              { chave: 'fp-raciocinio', titulo: 'Raciocínio passo a passo', ordem: 3 },
            ],
          },
          {
            chave: 'fp-controle-fluxo',
            titulo: 'Tipos, Variáveis e Controle de Fluxo',
            ordem: 2,
            licoes: [
              { chave: 'fp-variaveis', titulo: 'Variáveis e tipos de dados', ordem: 1 },
              { chave: 'fp-condicionais', titulo: 'Condicionais na prática', ordem: 2 },
              { chave: 'fp-lacos', titulo: 'Laços de repetição', ordem: 3 },
            ],
          },
          {
            chave: 'fp-funcoes-dados',
            titulo: 'Funções e Estruturas de Dados',
            ordem: 3,
            licoes: [
              { chave: 'fp-funcoes', titulo: 'Funções reutilizáveis', ordem: 1 },
              { chave: 'fp-colecoes', titulo: 'Listas, vetores e coleções', ordem: 2 },
              { chave: 'fp-depuracao', titulo: 'Depuração e revisão de código', ordem: 3 },
            ],
          },
        ],
      },
      {
        chave: 'desenvolvimento-web-frontend',
        titulo: 'Desenvolvimento Web Frontend',
        descricao:
          'Trilha voltada à construção de interfaces web modernas, responsivas e acessíveis com foco em experiência do usuário.',
        descricaoResumo:
          'Explora da estrutura HTML aos componentes reativos com Angular.',
        categoriaChave: 'frontend',
        modulos: [
          {
            chave: 'fe-fundamentos-web',
            titulo: 'Fundamentos da Web',
            ordem: 1,
            licoes: [
              { chave: 'fe-estruturas', titulo: 'Estrutura da web e semântica', ordem: 1 },
              { chave: 'fe-html', titulo: 'HTML semântico', ordem: 2 },
              { chave: 'fe-acessibilidade', titulo: 'Acessibilidade básica', ordem: 3 },
            ],
          },
          {
            chave: 'fe-css-responsivo',
            titulo: 'Interface Responsiva com CSS',
            ordem: 2,
            licoes: [
              { chave: 'fe-css', titulo: 'CSS e organização visual', ordem: 1 },
              { chave: 'fe-flex-grid', titulo: 'Flexbox e Grid', ordem: 2 },
              { chave: 'fe-responsivo', titulo: 'Design responsivo', ordem: 3 },
            ],
          },
          {
            chave: 'fe-angular',
            titulo: 'Angular na Prática',
            ordem: 3,
            licoes: [
              { chave: 'fe-componentes', titulo: 'Componentes com Angular', ordem: 1 },
              { chave: 'fe-comunicacao', titulo: 'Comunicação entre componentes', ordem: 2 },
              { chave: 'fe-rotas', titulo: 'Rotas e estado da interface', ordem: 3 },
            ],
          },
        ],
      },
      {
        chave: 'desenvolvimento-web-backend',
        titulo: 'Desenvolvimento Web Backend',
        descricao:
          'Trilha focada em APIs, regras de negócio, persistência e autenticação com NestJS.',
        descricaoResumo:
          'Ensina a estruturar serviços, contratos e integrações do lado do servidor.',
        categoriaChave: 'backend',
        modulos: [
          {
            chave: 'be-bases',
            titulo: 'Bases do NestJS',
            ordem: 1,
            licoes: [
              { chave: 'be-introducao', titulo: 'Introdução ao NestJS', ordem: 1 },
              { chave: 'be-services', titulo: 'Controllers e services', ordem: 2 },
              { chave: 'be-dtos', titulo: 'DTOs e validação', ordem: 3 },
            ],
          },
          {
            chave: 'be-rest-persistencia',
            titulo: 'APIs REST e Persistência',
            ordem: 2,
            licoes: [
              { chave: 'be-rest', titulo: 'REST e padrões de API', ordem: 1 },
              { chave: 'be-typeorm', titulo: 'Relacionamentos com TypeORM', ordem: 2 },
              { chave: 'be-erros', titulo: 'Tratamento de erros', ordem: 3 },
            ],
          },
          {
            chave: 'be-seguranca',
            titulo: 'Segurança e Integração',
            ordem: 3,
            licoes: [
              { chave: 'be-jwt', titulo: 'Autenticação JWT', ordem: 1 },
              { chave: 'be-autorizacao', titulo: 'Autorização por perfis', ordem: 2 },
              { chave: 'be-integracao', titulo: 'Integração com frontend', ordem: 3 },
            ],
          },
        ],
      },
      {
        chave: 'banco-dados-modelagem',
        titulo: 'Banco de Dados e Modelagem',
        descricao:
          'Trilha para entender estrutura relacional, consultas SQL, desempenho e manutenção de dados.',
        descricaoResumo:
          'Mostra como desenhar e consultar dados com consistência e eficiência.',
        categoriaChave: 'dados',
        modulos: [
          {
            chave: 'bd-modelagem',
            titulo: 'Modelagem Relacional',
            ordem: 1,
            licoes: [
              { chave: 'bd-entidades', titulo: 'Modelagem de entidades', ordem: 1 },
              { chave: 'bd-chaves', titulo: 'Chaves e cardinalidade', ordem: 2 },
              { chave: 'bd-normalizacao', titulo: 'Normalização de dados', ordem: 3 },
            ],
          },
          {
            chave: 'bd-sql',
            titulo: 'SQL para Análise e Operação',
            ordem: 2,
            licoes: [
              { chave: 'bd-consultas', titulo: 'SQL de consulta', ordem: 1 },
              { chave: 'bd-joins', titulo: 'JOINs e agregações', ordem: 2 },
              { chave: 'bd-filtros', titulo: 'Filtros e paginação', ordem: 3 },
            ],
          },
          {
            chave: 'bd-performance',
            titulo: 'Performance e Integridade',
            ordem: 3,
            licoes: [
              { chave: 'bd-indices', titulo: 'Índices e desempenho', ordem: 1 },
              { chave: 'bd-transacoes', titulo: 'Transações e consistência', ordem: 2 },
              { chave: 'bd-manutencao', titulo: 'Manutenção de dados', ordem: 3 },
            ],
          },
        ],
      },
      {
        chave: 'arquitetura-software',
        titulo: 'Arquitetura de Software e Boas Práticas',
        descricao:
          'Trilha avançada para organizar código, reduzir acoplamento, testar com qualidade e preparar o sistema para crescer.',
        descricaoResumo:
          'Conecta padrões de projeto, organização interna e práticas de manutenção.',
        categoriaChave: 'arquitetura',
        modulos: [
          {
            chave: 'ar-principios',
            titulo: 'Princípios de Design',
            ordem: 1,
            licoes: [
              { chave: 'ar-solid', titulo: 'SOLID na prática', ordem: 1 },
              { chave: 'ar-coesao', titulo: 'Coesão e acoplamento', ordem: 2 },
              { chave: 'ar-padroes', titulo: 'Padrões comuns de arquitetura', ordem: 3 },
            ],
          },
          {
            chave: 'ar-organizacao',
            titulo: 'Organização de Código',
            ordem: 2,
            licoes: [
              { chave: 'ar-camadas', titulo: 'Organização por camadas', ordem: 1 },
              { chave: 'ar-legibilidade', titulo: 'Nomenclatura e legibilidade', ordem: 2 },
              { chave: 'ar-refatoracao', titulo: 'Refatoração segura', ordem: 3 },
            ],
          },
          {
            chave: 'ar-qualidade',
            titulo: 'Qualidade, Testes e Observabilidade',
            ordem: 3,
            licoes: [
              { chave: 'ar-testes', titulo: 'Testes automatizados', ordem: 1 },
              { chave: 'ar-logs', titulo: 'Logs e observabilidade', ordem: 2 },
              { chave: 'ar-escalabilidade', titulo: 'Evolução e escalabilidade', ordem: 3 },
            ],
          },
        ],
      },
    ];
  }

  private obterMissoesSeed(agora: Date): MissaoSeed[] {
    const inicioDia = this.inicioDoDia(agora);
    const inicioSemana = this.inicioDaSemana(agora);
    const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
    const fimSemana = new Date(inicioSemana.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        chave: 'boas-vindas',
        titulo: 'Boas-vindas na plataforma',
        descricao:
          'Missão de início rápido para consolidar o primeiro contato com uma lição da trilha.',
        tipo: 'diaria',
        xpRecompensa: 20,
        objetivo: 'Concluir 1 lição introdutória hoje.',
        inicioEm: inicioDia,
        fimEm: fimDia,
      },
      {
        chave: 'foco-rapido',
        titulo: 'Foco rápido',
        descricao:
          'Missão curta para manter o ritmo e evitar sessões muito espaçadas.',
        tipo: 'diaria',
        xpRecompensa: 30,
        objetivo: 'Estudar por 25 minutos e concluir 1 lição no dia.',
        inicioEm: inicioDia,
        fimEm: fimDia,
      },
      {
        chave: 'ritmo-semanal',
        titulo: 'Ritmo semanal',
        descricao:
          'Missão recorrente para incentivar constância ao longo da semana.',
        tipo: 'semanal',
        xpRecompensa: 60,
        objetivo: 'Concluir 4 lições até o fim da semana.',
        inicioEm: inicioSemana,
        fimEm: fimSemana,
      },
      {
        chave: 'rotina-semanal',
        titulo: 'Rotina semanal',
        descricao:
          'Missão que valoriza disciplina e múltiplos dias de estudo na mesma semana.',
        tipo: 'semanal',
        xpRecompensa: 70,
        objetivo: 'Estudar em 3 dias diferentes durante a semana.',
        inicioEm: inicioSemana,
        fimEm: fimSemana,
      },
      {
        chave: 'projeto-base',
        titulo: 'Projeto base guiado',
        descricao:
          'Missão única que simula a entrega de uma jornada inicial de aprendizagem.',
        tipo: 'unica',
        xpRecompensa: 120,
        objetivo: 'Concluir ao menos 12 lições em trilhas complementares.',
        inicioEm: this.criarDataRelativa(agora, 30, 9, 0),
        fimEm: null,
      },
      {
        chave: 'desafio-integracao',
        titulo: 'Desafio de integração',
        descricao:
          'Missão única mais robusta, pensada para estudantes com maior volume de estudo.',
        tipo: 'unica',
        xpRecompensa: 150,
        objetivo: 'Concluir 20 lições e 2 missões na plataforma.',
        inicioEm: this.criarDataRelativa(agora, 30, 9, 0),
        fimEm: null,
      },
    ];
  }

  private obterConquistasSeed(): ConquistaSeed[] {
    return [
      {
        chave: 'primeira-licao',
        codigo: 'primeira-licao',
        titulo: 'Primeira lição',
        descricao: 'Concluiu a primeira lição da jornada.',
        icone: 'estrela',
        tipoCriterio: 'licoes_concluidas',
        valorCriterio: 1,
        criterio: 'Concluir 1 lição.',
      },
      {
        chave: 'dez-licoes',
        codigo: 'dez-licoes',
        titulo: 'Ritmo de estudo',
        descricao: 'Concluiu dez lições.',
        icone: 'livro',
        tipoCriterio: 'licoes_concluidas',
        valorCriterio: 10,
        criterio: 'Concluir 10 lições.',
      },
      {
        chave: 'vinte-licoes',
        codigo: 'vinte-licoes',
        titulo: 'Trilho consistente',
        descricao: 'Concluiu vinte lições na plataforma.',
        icone: 'caderno',
        tipoCriterio: 'licoes_concluidas',
        valorCriterio: 20,
        criterio: 'Concluir 20 lições.',
      },
      {
        chave: 'cem-xp',
        codigo: 'cem-xp',
        titulo: '100 XP',
        descricao: 'Alcançou 100 XP acumulados.',
        icone: 'trofeu',
        tipoCriterio: 'xp_total',
        valorCriterio: 100,
        criterio: 'Acumular 100 XP.',
      },
      {
        chave: 'trezentos-xp',
        codigo: 'trezentos-xp',
        titulo: '300 XP',
        descricao: 'Atingiu uma marca avançada de XP.',
        icone: 'trofeu-premio',
        tipoCriterio: 'xp_total',
        valorCriterio: 300,
        criterio: 'Acumular 300 XP.',
      },
      {
        chave: 'sequencia-tres-dias',
        codigo: 'sequencia-tres-dias',
        titulo: 'Três dias seguidos',
        descricao: 'Manteve uma sequência de três dias de estudo.',
        icone: 'fogo',
        tipoCriterio: 'sequencia_dias',
        valorCriterio: 3,
        criterio: 'Manter sequência ativa de 3 dias.',
      },
      {
        chave: 'sequencia-sete-dias',
        codigo: 'sequencia-sete-dias',
        titulo: 'Semana inteira',
        descricao: 'Manteve uma sequência de sete dias de estudo.',
        icone: 'chama',
        tipoCriterio: 'sequencia_dias',
        valorCriterio: 7,
        criterio: 'Manter sequência ativa de 7 dias.',
      },
      {
        chave: 'primeira-missao',
        codigo: 'primeira-missao',
        titulo: 'Missão cumprida',
        descricao: 'Concluiu a primeira missão.',
        icone: 'medalha',
        tipoCriterio: 'missoes_concluidas',
        valorCriterio: 1,
        criterio: 'Concluir 1 missão.',
      },
      {
        chave: 'tres-missoes',
        codigo: 'tres-missoes',
        titulo: 'Missões em sequência',
        descricao: 'Concluiu três missões na plataforma.',
        icone: 'insignia',
        tipoCriterio: 'missoes_concluidas',
        valorCriterio: 3,
        criterio: 'Concluir 3 missões.',
      },
    ];
  }

  private obterPerfisUsuariosSeed(): PerfilUsuarioSeed[] {
    return [
      {
        chave: 'ana-beatriz',
        nome: 'Ana Beatriz Souza',
        email: 'ana.souza@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 0,
        quantidadeLicoes: 4,
        diasEstudo: [3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'boas-vindas',
            status: 'concluida',
            diasAtras: 0,
            hora: 19,
            minuto: 20,
          },
          {
            missaoChave: 'ritmo-semanal',
            status: 'em_andamento',
            diasAtras: 1,
            hora: 20,
            minuto: 10,
          },
        ],
      },
      {
        chave: 'bruno-henrique',
        nome: 'Bruno Henrique Costa',
        email: 'bruno.costa@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 0,
        quantidadeLicoes: 14,
        diasEstudo: [6, 5, 4, 3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'boas-vindas',
            status: 'concluida',
            diasAtras: 0,
            hora: 18,
            minuto: 40,
          },
          {
            missaoChave: 'ritmo-semanal',
            status: 'concluida',
            diasAtras: 1,
            hora: 20,
            minuto: 30,
          },
        ],
      },
      {
        chave: 'camila-rocha',
        nome: 'Camila Rocha Pereira',
        email: 'camila.pereira@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 0,
        quantidadeLicoes: 31,
        diasEstudo: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'foco-rapido',
            status: 'concluida',
            diasAtras: 0,
            hora: 19,
            minuto: 50,
          },
          {
            missaoChave: 'rotina-semanal',
            status: 'concluida',
            diasAtras: 1,
            hora: 20,
            minuto: 5,
          },
          {
            missaoChave: 'projeto-base',
            status: 'concluida',
            diasAtras: 0,
            hora: 21,
            minuto: 0,
          },
        ],
      },
      {
        chave: 'daniel-martins',
        nome: 'Daniel Martins Alves',
        email: 'daniel.alves@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 4,
        quantidadeLicoes: 7,
        diasEstudo: [12, 11, 10, 8, 7, 6, 5],
        planoMissoes: [],
      },
      {
        chave: 'elisa-fernandes',
        nome: 'Elisa Fernandes Lima',
        email: 'elisa.lima@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 18,
        quantidadeLicoes: 22,
        diasEstudo: [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'ritmo-semanal',
            status: 'concluida',
            diasAtras: 3,
            hora: 20,
            minuto: 0,
          },
          {
            missaoChave: 'desafio-integracao',
            status: 'concluida',
            diasAtras: 2,
            hora: 21,
            minuto: 10,
          },
        ],
      },
      {
        chave: 'felipe-nogueira',
        nome: 'Felipe Nogueira Santos',
        email: 'felipe.santos@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 0,
        quantidadeLicoes: 2,
        diasEstudo: [7, 4],
        planoMissoes: [
          {
            missaoChave: 'boas-vindas',
            status: 'em_andamento',
            diasAtras: 4,
            hora: 18,
            minuto: 30,
          },
        ],
      },
      {
        chave: 'gabriela-almeida',
        nome: 'Gabriela Almeida Moura',
        email: 'gabriela.moura@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 6,
        quantidadeLicoes: 18,
        diasEstudo: [5, 4, 3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'boas-vindas',
            status: 'concluida',
            diasAtras: 0,
            hora: 18,
            minuto: 20,
          },
          {
            missaoChave: 'foco-rapido',
            status: 'concluida',
            diasAtras: 0,
            hora: 20,
            minuto: 0,
          },
        ],
      },
      {
        chave: 'henrique-barbosa',
        nome: 'Henrique Barbosa Pinto',
        email: 'henrique.pinto@alunos.tcc.local',
        papel: 'estudante',
        status: 'ativo',
        senha: 'Senha@123',
        indiceInicialLicao: 9,
        quantidadeLicoes: 36,
        diasEstudo: [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        planoMissoes: [
          {
            missaoChave: 'boas-vindas',
            status: 'concluida',
            diasAtras: 0,
            hora: 18,
            minuto: 0,
          },
          {
            missaoChave: 'ritmo-semanal',
            status: 'concluida',
            diasAtras: 1,
            hora: 19,
            minuto: 40,
          },
          {
            missaoChave: 'rotina-semanal',
            status: 'concluida',
            diasAtras: 2,
            hora: 20,
            minuto: 15,
          },
          {
            missaoChave: 'projeto-base',
            status: 'concluida',
            diasAtras: 0,
            hora: 21,
            minuto: 20,
          },
        ],
      },
      {
        chave: 'mariana-ribeiro',
        nome: 'Mariana Costa Ribeiro',
        email: 'mariana.ribeiro@tcc.local',
        papel: 'administrador',
        status: 'ativo',
        senha: 'Admin@123',
        indiceInicialLicao: 0,
        quantidadeLicoes: 0,
        diasEstudo: [],
        planoMissoes: [],
      },
    ];
  }

  private processarEventosUsuario(
    perfil: PerfilUsuarioSeed,
    eventos: EventoXpGerado[],
    dataUltimoAcesso: Date | null,
  ): { resumo: ResumoUsuarioGerado; conquistas: RegistroConquistaUsuarioGerado[] } {
    let xpTotal = 0;
    let nivel = 1;
    let licoesConcluidas = 0;
    let missoesConcluidas = 0;
    const conquistas = new Map<string, Date>();
    const ultimaDataEvento = eventos.at(-1)?.data ?? dataUltimoAcesso;

    for (const evento of eventos) {
      xpTotal += evento.quantidade;
      nivel = this.calcularNivel(xpTotal);

      if (evento.tipoOrigem === 'conclusao_licao') {
        licoesConcluidas += 1;
      } else {
        missoesConcluidas += 1;
      }

      if (licoesConcluidas === 1) conquistas.set('primeira-licao', evento.data);
      if (licoesConcluidas === 10) conquistas.set('dez-licoes', evento.data);
      if (licoesConcluidas === 20) conquistas.set('vinte-licoes', evento.data);
      if (xpTotal >= 100 && !conquistas.has('cem-xp')) {
        conquistas.set('cem-xp', evento.data);
      }
      if (xpTotal >= 300 && !conquistas.has('trezentos-xp')) {
        conquistas.set('trezentos-xp', evento.data);
      }
      if (missoesConcluidas === 1) {
        conquistas.set('primeira-missao', evento.data);
      }
      if (missoesConcluidas === 3) {
        conquistas.set('tres-missoes', evento.data);
      }
    }

    const sequenciaDias = this.calcularSequenciaDias(perfil.diasEstudo);
    if (sequenciaDias >= 3 && ultimaDataEvento) {
      conquistas.set('sequencia-tres-dias', ultimaDataEvento);
    }
    if (sequenciaDias >= 7 && ultimaDataEvento) {
      conquistas.set('sequencia-sete-dias', ultimaDataEvento);
    }

    const listaConquistas = Array.from(conquistas.entries()).map(
      ([conquistaChave, conquistadoEm]) => ({
        usuarioChave: perfil.chave,
        conquistaChave,
        conquistadoEm,
      }),
    );

    return {
      resumo: {
        xpTotal,
        nivel,
        sequenciaDias,
        ultimoAcessoEm: dataUltimoAcesso ?? ultimaDataEvento ?? null,
      },
      conquistas: listaConquistas,
    };
  }

  private async ajustarHistoricosXp(
    queryRunner: QueryRunner,
    eventosXp: EventoXpGerado[],
    usuariosPorChave: Map<string, string>,
    licoesPorChave: Map<
      string,
      { id: string; trilhaChave: string; moduloChave: string; ordem: number }
    >,
    registrosMissaoUsuario: RegistroMissaoUsuarioGerado[],
  ): Promise<void> {
    const historicos = new Array<{
      id: string;
      usuarioId: string;
      quantidade: number;
      tipoOrigem: TipoOrigemXp;
      referenciaOrigemId: string;
      xpTotalAposEvento: number;
      nivelAposEvento: number;
      criadoEm: Date;
    }>();
    const acumuladoPorUsuario = new Map<string, { xpTotal: number }>();

    for (const evento of eventosXp.sort(
      (a, b) => a.data.getTime() - b.data.getTime(),
    )) {
      const usuarioId = usuariosPorChave.get(evento.usuarioChave) as string;
      const acumuladoAtual = acumuladoPorUsuario.get(usuarioId) ?? { xpTotal: 0 };
      acumuladoAtual.xpTotal += evento.quantidade;
      acumuladoPorUsuario.set(usuarioId, acumuladoAtual);

      historicos.push({
        id: this.gerarUuidEstavel(
          `xp:${evento.usuarioChave}:${evento.tipoOrigem}:${evento.referenciaOrigemChave}:${this.formatarDataIso(
            evento.data,
          )}`,
        ),
        usuarioId,
        quantidade: evento.quantidade,
        tipoOrigem: evento.tipoOrigem,
        referenciaOrigemId:
          evento.tipoOrigem === 'conclusao_licao'
            ? (licoesPorChave.get(evento.referenciaOrigemChave)?.id as string)
            : (registrosMissaoUsuario.find(
                (registro) =>
                  `missao-usuario:${registro.usuarioChave}:${registro.missaoChave}:${registro.cicloReferencia}` ===
                  evento.referenciaOrigemChave,
              )?.id as string),
        xpTotalAposEvento: acumuladoAtual.xpTotal,
        nivelAposEvento: this.calcularNivel(acumuladoAtual.xpTotal),
        criadoEm: evento.data,
      });
    }

    await queryRunner.manager.insert(HistoricoXp, historicos);
  }

  private criarDescricaoLicao(
    trilhaTitulo: string,
    moduloTitulo: string,
    licaoTitulo: string,
  ): string {
    return `Aula prática da trilha ${trilhaTitulo}, no módulo ${moduloTitulo}, com foco em ${licaoTitulo.toLowerCase()}.`;
  }

  private criarTextoConteudo(
    trilhaTitulo: string,
    moduloTitulo: string,
    licaoTitulo: string,
  ): string {
    return `Nesta lição de ${trilhaTitulo}, o estudante trabalha ${licaoTitulo.toLowerCase()} dentro do contexto de ${moduloTitulo}. O objetivo é aplicar o conteúdo em um cenário real da plataforma.`;
  }

  private definirTipoSecundario(ordem: number): TipoConteudoLicao {
    if (ordem === 1) return 'video';
    if (ordem === 2) return 'pdf';
    return 'link';
  }

  private tituloConteudoSecundario(tipo: TipoConteudoLicao): string {
    if (tipo === 'video') return 'Aula em vídeo';
    if (tipo === 'pdf') return 'Resumo em PDF';
    return 'Leitura complementar';
  }

  private textoConteudoSecundario(
    licaoTitulo: string,
    tipo: TipoConteudoLicao,
  ): string {
    if (tipo === 'video') {
      return `Vídeo de apoio para visualizar a aplicação prática de ${licaoTitulo.toLowerCase()}.`;
    }
    if (tipo === 'pdf') {
      return `Material de apoio em PDF para revisar os pontos centrais de ${licaoTitulo.toLowerCase()}.`;
    }
    return `Link externo com documentação e exemplos complementares sobre ${licaoTitulo.toLowerCase()}.`;
  }

  private obterUrlConteudo(
    trilhaChave: string,
    tipo: TipoConteudoLicao,
  ): string | null {
    const video = 'https://www.youtube.com/watch?v=PkZNo7MFNFg';
    const pdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const links: Record<string, string> = {
      'fundamentos-programacao':
        'https://developer.mozilla.org/pt-BR/docs/Learn/JavaScript/First_steps',
      'desenvolvimento-web-frontend':
        'https://angular.dev/guide/overview',
      'desenvolvimento-web-backend': 'https://docs.nestjs.com/',
      'banco-dados-modelagem': 'https://www.postgresql.org/docs/current/',
      'arquitetura-software': 'https://martinfowler.com/architecture/',
    };

    if (tipo === 'video') return video;
    if (tipo === 'pdf') return pdf;
    return links[trilhaChave] ?? null;
  }

  private calcularNivel(xpTotal: number): number {
    return Math.floor(xpTotal / 100) + 1;
  }

  private calcularSequenciaDias(diasEstudo: number[]): number {
    if (diasEstudo.length === 0) return 0;

    const conjunto = new Set(diasEstudo);
    const ultimoDia = Math.min(...diasEstudo);
    let diasConsecutivos = 0;

    for (let diaAtual = ultimoDia; conjunto.has(diaAtual); diaAtual += 1) {
      diasConsecutivos += 1;
    }

    return diasConsecutivos;
  }

  private gerarUuidEstavel(chave: string): string {
    const hash = createHash('sha1').update(chave).digest('hex').slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(
      12,
      16,
    )}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }

  private criarDataRelativa(
    base: Date,
    diasAtras: number,
    hora: number,
    minuto: number,
  ): Date {
    const data = new Date(base);
    data.setDate(data.getDate() - diasAtras);
    data.setHours(hora, minuto, 0, 0);
    return data;
  }

  private inicioDoDia(data: Date): Date {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  private inicioDaSemana(data: Date): Date {
    const inicio = this.inicioDoDia(data);
    const diasDesdeSegunda = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diasDesdeSegunda);
    return inicio;
  }

  private calcularCicloReferencia(
    tipo: TipoMissao,
    data: Date,
  ): string {
    if (tipo === 'unica') return 'unica';
    if (tipo === 'semanal') return this.formatarSemanaIso(data);
    return this.formatarDataIso(data);
  }

  private formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private formatarSemanaIso(data: Date): string {
    const dataUtc = new Date(
      Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()),
    );
    const diaSemana = dataUtc.getUTCDay() || 7;
    dataUtc.setUTCDate(dataUtc.getUTCDate() + 4 - diaSemana);

    const ano = dataUtc.getUTCFullYear();
    const inicioAno = new Date(Date.UTC(ano, 0, 1));
    const semana = Math.ceil(
      ((dataUtc.getTime() - inicioAno.getTime()) / 86400000 + 1) / 7,
    );

    return `${ano}-W${String(semana).padStart(2, '0')}`;
  }

}
