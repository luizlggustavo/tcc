import { Usuario } from '../../usuario/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('progresso_usuarios')
export class ProgressoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', unique: true })
  usuarioId: string;

  @Column({ name: 'xp_total', default: 0 })
  xpTotal: number;

  @Column({ default: 1 })
  nivel: number;

  @Column({ name: 'sequencia_dias', default: 0 })
  sequenciaDias: number;

  @Column({ name: 'ultimo_acesso_em', type: 'timestamp', nullable: true })
  ultimoAcessoEm: Date | null;

  @OneToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
