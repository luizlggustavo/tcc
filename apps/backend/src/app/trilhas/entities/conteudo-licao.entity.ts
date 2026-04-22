import { TipoConteudoLicao } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Licao } from './licao.entity';

@Entity('conteudos_licoes')
export class ConteudoLicao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  tipo: TipoConteudoLicao;

  @Column({ nullable: true })
  titulo: string | null;

  @Column({ type: 'text', nullable: true })
  texto: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ default: 0 })
  ordem: number;

  @Column({ default: false })
  publicado: boolean;

  @Column({ name: 'licao_id' })
  licaoId: string;

  @ManyToOne(() => Licao, (licao) => licao.conteudos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'licao_id' })
  licao: Licao;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
