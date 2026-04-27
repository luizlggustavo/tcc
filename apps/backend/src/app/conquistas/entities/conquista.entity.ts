import { IConquista, TipoCriterioConquista } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConquistaUsuario } from './conquista-usuario.entity';

@Entity('conquistas')
@Index('IDX_conquistas_ativas_criterio', ['ativa', 'tipoCriterio'])
export class Conquista implements IConquista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column()
  icone: string;

  @Column({ name: 'xp_recompensa', default: 0 })
  xpRecompensa: number;

  @Column({ name: 'tipo_criterio', type: 'varchar' })
  tipoCriterio: TipoCriterioConquista;

  @Column({ name: 'valor_criterio' })
  valorCriterio: number;

  @Column({ type: 'text' })
  criterio: string;

  @Column({ default: true })
  ativa: boolean;

  @OneToMany(() => ConquistaUsuario, (conquistaUsuario) => conquistaUsuario.conquista)
  usuarios: ConquistaUsuario[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
