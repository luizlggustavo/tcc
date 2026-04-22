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
import { CategoriaTrilha } from './categoria-trilha.entity';
import { ModuloTrilha } from './modulo-trilha.entity';

@Entity('trilhas')
export class Trilha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ name: 'descricao_resumo', type: 'text' })
  descricaoResumo: string;

  @Column({ default: false })
  publicada: boolean;

  @Column({ name: 'categoria_id' })
  categoriaId: string;

  @ManyToOne(() => CategoriaTrilha, (categoria) => categoria.trilhas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaTrilha;

  @OneToMany(() => ModuloTrilha, (modulo) => modulo.trilha)
  modulos: ModuloTrilha[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
