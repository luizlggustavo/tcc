import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProgressoService } from '../progresso/progresso.service';
import { Usuario } from './entities/usuario.entity';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let repository: jest.Mocked<
    Pick<Repository<Usuario>, 'findOneBy' | 'create' | 'save'>
  >;
  let progressoService: jest.Mocked<Pick<ProgressoService, 'obterOuCriarInicial'>>;

  beforeEach(() => {
    repository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    progressoService = {
      obterOuCriarInicial: jest.fn().mockResolvedValue({
        xpTotal: 0,
        nivel: 1,
        sequenciaDias: 0,
      }),
    };
    service = new UsuarioService(
      repository as unknown as Repository<Usuario>,
      progressoService as unknown as ProgressoService,
    );
  });

  it('deve retornar apenas o perfil do usuário autenticado', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'usuario-1',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      papel: 'estudante',
      status: 'ativo',
    } as Usuario);

    await expect(service.buscarPerfil('usuario-1')).resolves.toEqual({
      usuario: {
        id: 'usuario-1',
        nome: 'Ana Silva',
        email: 'ana@email.com',
        papel: 'estudante',
        status: 'ativo',
      },
      progresso: {
        xpTotal: 0,
        nivel: 1,
        sequenciaDias: 0,
      },
    });
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'usuario-1' });
  });

  it('deve rejeitar atualização quando e-mail já está em uso', async () => {
    repository.findOneBy
      .mockResolvedValueOnce({
        id: 'usuario-1',
        nome: 'Ana Silva',
        email: 'ana@email.com',
        papel: 'estudante',
        status: 'ativo',
      } as Usuario)
      .mockResolvedValueOnce({
        id: 'usuario-2',
        nome: 'Bruno Lima',
        email: 'bruno@email.com',
        papel: 'estudante',
        status: 'ativo',
      } as Usuario);

    await expect(
      service.atualizarPerfil('usuario-1', { email: 'bruno@email.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deve rejeitar autenticação de usuário inativo', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 'usuario-1',
      nome: 'Ana Silva',
      email: 'ana@email.com',
      papel: 'estudante',
      status: 'inativo',
    } as Usuario);

    await expect(service.buscarAutenticado('usuario-1')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
