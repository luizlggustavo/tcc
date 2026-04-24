import { IEventoXp, TipoOrigemXp } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuario/entities/usuario.entity';

@Entity('historicos_xp')
@Index('IDX_historicos_xp_usuario_periodo', ['usuarioId', 'criadoEm'])
@Index('IDX_historicos_xp_origem', ['tipoOrigem', 'referenciaOrigemId'])
export class HistoricoXp implements IEventoXp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column()
  quantidade: number;

  @Column({ name: 'tipo_origem', type: 'varchar' })
  tipoOrigem: TipoOrigemXp;

  @Column({ name: 'referencia_origem_id', type: 'uuid' })
  referenciaOrigemId: string;

  @Column({ name: 'xp_total_apos_evento' })
  xpTotalAposEvento: number;

  @Column({ name: 'nivel_apos_evento' })
  nivelAposEvento: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
