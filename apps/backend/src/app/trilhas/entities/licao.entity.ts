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
import { ConteudoLicao } from './conteudo-licao.entity';
import { ModuloTrilha } from './modulo-trilha.entity';

@Entity('licoes')
export class Licao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ default: 0 })
  ordem: number;

  @Column({ default: false })
  publicada: boolean;

  @Column({ name: 'modulo_id' })
  moduloId: string;

  @ManyToOne(() => ModuloTrilha, (modulo) => modulo.licoes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modulo_id' })
  modulo: ModuloTrilha;

  @OneToMany(() => ConteudoLicao, (conteudo) => conteudo.licao)
  conteudos: ConteudoLicao[];

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
