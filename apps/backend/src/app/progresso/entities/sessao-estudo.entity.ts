import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Licao } from '../../trilhas/entities/licao.entity';
import { Trilha } from '../../trilhas/entities/trilha.entity';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('sessoes_estudo')
@Index('IDX_sessoes_estudo_usuario_periodo', ['usuarioId', 'inicioEm'])
export class SessaoEstudo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'trilha_id', type: 'uuid' })
  trilhaId: string;

  @Column({ name: 'licao_id', type: 'uuid' })
  licaoId: string;

  @Column({ name: 'inicio_em', type: 'timestamp' })
  inicioEm: Date;

  @Column({ name: 'fim_em', type: 'timestamp' })
  fimEm: Date;

  @Column({ name: 'duracao_segundos' })
  duracaoSegundos: number;

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
