import { Exclude } from 'class-transformer';
import { PapelUsuario, StatusUsuario } from '@tcc/interfaces';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', default: 'estudante' })
  papel: PapelUsuario;

  @Column({ type: 'varchar', default: 'ativo' })
  status: StatusUsuario;

  @Exclude()
  @Column()
  hashSenha: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}
