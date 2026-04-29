import { Usuario } from '../../usuario/entities/usuario.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('acessos_usuarios')
@Index('IDX_acessos_usuarios_usuario_periodo', ['usuarioId', 'acessadoEm'])
export class AcessoUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'acessado_em', type: 'timestamp' })
  acessadoEm: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
