import { IMissaoUsuario, StatusMissao } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Missao } from './missao.entity';

@Entity('missoes_usuarios')
@Unique('UQ_missoes_usuarios_usuario_missao_ciclo', [
  'usuarioId',
  'missaoId',
  'cicloReferencia',
])
@Index('IDX_missoes_usuarios_usuario_status', ['usuarioId', 'status'])
export class MissaoUsuario implements IMissaoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'missao_id', type: 'uuid' })
  missaoId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ type: 'varchar', default: 'em_andamento' })
  status: StatusMissao;

  @Column({ name: 'ciclo_referencia' })
  cicloReferencia: string;

  @Column({ name: 'iniciado_em', type: 'timestamp', nullable: true })
  iniciadoEm: Date | null;

  @Column({ name: 'concluido_em', type: 'timestamp', nullable: true })
  concluidoEm: Date | null;

  @ManyToOne(() => Missao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'missao_id' })
  missao: Missao;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
