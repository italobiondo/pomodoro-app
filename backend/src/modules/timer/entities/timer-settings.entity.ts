import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/user.entity'; // ajuste o caminho se seu User estiver em outro lugar

@Entity('timer_settings')
export class TimerSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'int', default: 25 })
  pomodoroDuration: number; // minutos de foco

  @Column({ type: 'int', default: 5 })
  shortBreakDuration: number; // minutos de pausa curta

  @Column({ type: 'int', default: 15 })
  longBreakDuration: number; // minutos de pausa longa

  @Column({ type: 'boolean', default: false })
  autoStart: boolean; // auto start do próximo ciclo

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
