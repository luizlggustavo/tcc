import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IPerfilUsuario, IUsuarioResumo } from '@tcc/interfaces';
import { Repository } from 'typeorm';
import { ProgressoService } from '../progresso/progresso.service';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly progressoService: ProgressoService,
  ) {}

  async registrar(dados: {
    nome: string;
    email: string;
    password: string;
  }): Promise<IUsuarioResumo> {
    const existente = await this.usuarioRepository.findOneBy({
      email: dados.email,
    });
    if (existente) throw new ConflictException('E-mail já cadastrado');

    const hashSenha = await bcrypt.hash(dados.password, 12);
    const usuario = this.usuarioRepository.create({
      nome: dados.nome,
      email: dados.email,
      hashSenha,
      papel: 'estudante',
      status: 'ativo',
    });
    const salvo = await this.usuarioRepository.save(usuario);
    await this.progressoService.obterOuCriarInicial(salvo.id);
    return this.mapearResumo(salvo);
  }

  async buscarPorEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOneBy({ email });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async buscarAutenticado(id: string) {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario || usuario.status !== 'ativo') {
      throw new UnauthorizedException('Usuário inativo ou inexistente');
    }

    return this.mapearResumo(usuario);
  }

  async buscarPorId(id: string): Promise<IUsuarioResumo> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return this.mapearResumo(usuario);
  }

  async buscarPerfil(id: string): Promise<IPerfilUsuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    return {
      usuario: this.mapearResumo(usuario),
      progresso: await this.progressoService.obterOuCriarInicial(usuario.id),
    };
  }

  async atualizarPerfil(
    id: string,
    dados: AtualizarPerfilDto,
  ): Promise<IPerfilUsuario> {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    if (dados.email && dados.email !== usuario.email) {
      const usuarioComEmail = await this.usuarioRepository.findOneBy({
        email: dados.email,
      });
      if (usuarioComEmail) throw new ConflictException('E-mail já cadastrado');
      usuario.email = dados.email;
    }

    if (dados.nome) usuario.nome = dados.nome;

    const salvo = await this.usuarioRepository.save(usuario);

    return {
      usuario: this.mapearResumo(salvo),
      progresso: await this.progressoService.obterOuCriarInicial(salvo.id),
    };
  }

  private mapearResumo(usuario: Usuario): IUsuarioResumo {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      status: usuario.status,
    };
  }
}
