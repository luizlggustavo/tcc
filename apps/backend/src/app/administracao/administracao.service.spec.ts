import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Conquista } from '../conquistas/entities/conquista.entity';
import { Missao } from '../missoes/entities/missao.entity';
import { CategoriaTrilha } from '../trilhas/entities/categoria-trilha.entity';
import { ConteudoLicao } from '../trilhas/entities/conteudo-licao.entity';
import { Licao } from '../trilhas/entities/licao.entity';
import { ModuloTrilha } from '../trilhas/entities/modulo-trilha.entity';
import { Trilha } from '../trilhas/entities/trilha.entity';
import { Usuario } from '../usuario/entities/usuario.entity';
import { AdministracaoService } from './administracao.service';

describe('AdministracaoService', () => {
  let service: AdministracaoService;
  let usuariosRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
  };
  let conteudosRepository: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };
  let missoesRepository: {
    find: jest.Mock;
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    usuariosRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(async (usuario) => usuario),
    };
    conteudosRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(async (conteudo) => conteudo),
    };
    missoesRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(async (missao) => missao),
    };

    service = new AdministracaoService(
      usuariosRepository as unknown as Repository<Usuario>,
      criarRepositorioVazio<CategoriaTrilha>(),
      criarRepositorioVazio<Trilha>(),
      criarRepositorioVazio<ModuloTrilha>(),
      criarRepositorioVazio<Licao>(),
      conteudosRepository as unknown as Repository<ConteudoLicao>,
      missoesRepository as unknown as Repository<Missao>,
      criarRepositorioVazio<Conquista>(),
    );
  });

  it('deve impedir que administrador inative a si mesmo', async () => {
    usuariosRepository.findOneBy.mockResolvedValue(criarUsuario());

    await expect(
      service.atualizarUsuario('usuario-1', 'usuario-1', {
        status: 'inativo',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve alterar papel e status de outro usuário', async () => {
    usuariosRepository.findOneBy.mockResolvedValue(criarUsuario());

    await expect(
      service.atualizarUsuario('admin-1', 'usuario-1', {
        papel: 'administrador',
        status: 'inativo',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        papel: 'administrador',
        status: 'inativo',
      }),
    );
  });

  it('deve despublicar conteúdo sem excluir registro', async () => {
    conteudosRepository.findOneBy.mockResolvedValue({
      id: 'conteudo-1',
      tipo: 'texto',
      titulo: 'Introdução',
      texto: 'Conteúdo',
      url: null,
      ordem: 1,
      publicado: true,
    } as ConteudoLicao);

    await expect(
      service.atualizarConteudo('conteudo-1', { publicado: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'conteudo-1',
        publicado: false,
      }),
    );
  });

  it('deve inativar missão sem alterar registros de usuário', async () => {
    missoesRepository.findOneBy.mockResolvedValue(criarMissao());

    await expect(
      service.atualizarMissao('missao-1', { ativa: false }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'missao-1',
        ativa: false,
      }),
    );
  });
});

function criarRepositorioVazio<T>(): Repository<T> {
  return {
    create: jest.fn((dados) => dados),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(async (dados) => dados),
  } as unknown as Repository<T>;
}

function criarUsuario(sobrescritas: Partial<Usuario> = {}): Usuario {
  return {
    id: 'usuario-1',
    nome: 'Ana Silva',
    email: 'ana@email.com',
    papel: 'estudante',
    status: 'ativo',
    hashSenha: 'hash',
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as Usuario;
}

function criarMissao(sobrescritas: Partial<Missao> = {}): Missao {
  return {
    id: 'missao-1',
    titulo: 'Estudar hoje',
    descricao: 'Concluir uma atividade.',
    tipo: 'diaria',
    xpRecompensa: 20,
    objetivo: 'conclusao_manual',
    ativa: true,
    inicioEm: null,
    fimEm: null,
    criadoEm: new Date('2026-06-01T00:00:00.000Z'),
    atualizadoEm: new Date('2026-06-01T00:00:00.000Z'),
    ...sobrescritas,
  } as Missao;
}
