import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PapelUsuario } from '@tcc/interfaces';
import { PAPEIS_KEY } from '../decorators/papeis.decorator';

interface RequisicaoComUsuario {
  user?: {
    papel?: PapelUsuario;
  };
}

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.getAllAndOverride<PapelUsuario[]>(
      PAPEIS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!papeisPermitidos?.length) return true;

    const requisicao = context.switchToHttp().getRequest<RequisicaoComUsuario>();
    const papel = requisicao.user?.papel;

    if (papel && papeisPermitidos.includes(papel)) return true;

    throw new ForbiddenException('Acesso permitido apenas para administradores');
  }
}
