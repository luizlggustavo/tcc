import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Licao } from './licao.entity';
import { Trilha } from './trilha.entity';

@Entity('modulos_trilhas')
export class ModuloTrilha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ default: 0 })
  ordem: number;

  @Column({ default: false })
  publicado: boolean;

  @Column({ name: 'trilha_id' })
  trilhaId: string;

  @ManyToOne(() => Trilha, (trilha) => trilha.modulos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trilha_id' })
  trilha: Trilha;

  @OneToMany(() => Licao, (licao) => licao.modulo)
  licoes: Licao[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
