import { IConquistaUsuario } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';
import { Conquista } from './conquista.entity';

@Entity('conquistas_usuarios')
@Unique('UQ_conquistas_usuarios_usuario_conquista', [
  'usuarioId',
  'conquistaId',
])
@Index('IDX_conquistas_usuarios_usuario', ['usuarioId'])
export class ConquistaUsuario implements IConquistaUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conquista_id', type: 'uuid' })
  conquistaId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'conquistado_em', type: 'timestamp' })
  conquistadoEm: Date;

  @ManyToOne(() => Conquista, (conquista) => conquista.usuarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conquista_id' })
  conquista: Conquista;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
