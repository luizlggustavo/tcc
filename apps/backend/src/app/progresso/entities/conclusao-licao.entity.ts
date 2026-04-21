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
import { Licao } from '../../trilhas/entities/licao.entity';
import { Trilha } from '../../trilhas/entities/trilha.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('conclusoes_licoes')
@Unique('UQ_conclusoes_licoes_usuario_licao', ['usuarioId', 'licaoId'])
@Index('IDX_conclusoes_licoes_usuario_trilha', ['usuarioId', 'trilhaId'])
export class ConclusaoLicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'trilha_id', type: 'uuid' })
  trilhaId: string;

  @Column({ name: 'licao_id', type: 'uuid' })
  licaoId: string;

  @Column({ name: 'concluida_em', type: 'timestamp' })
  concluidaEm: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Trilha, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trilha_id' })
  trilha: Trilha;

  @ManyToOne(() => Licao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licao_id' })
  licao: Licao;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
