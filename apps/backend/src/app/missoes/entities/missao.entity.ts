import { IMissao, TipoMissao } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('missoes')
@Index('IDX_missoes_disponibilidade', ['ativa', 'tipo'])
export class Missao implements IMissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'varchar' })
  tipo: TipoMissao;

  @Column({ name: 'xp_recompensa' })
  xpRecompensa: number;

  @Column({ type: 'text' })
  objetivo: string;

  @Column({ default: true })
  ativa: boolean;

  @Column({ name: 'inicio_em', type: 'timestamp', nullable: true })
  inicioEm: Date | null;

  @Column({ name: 'fim_em', type: 'timestamp', nullable: true })
  fimEm: Date | null;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
