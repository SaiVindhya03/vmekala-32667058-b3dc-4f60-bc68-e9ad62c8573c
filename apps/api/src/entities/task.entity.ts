import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  // SQLite does not support enum columns; store as text with constrained defaults
  @Column({
    type: 'text',
    default: 'todo',
  })
  status: 'todo' | 'in-progress' | 'done';

  @Column({ default: 'Work' })
  category: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization, (organization) => organization.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  createdBy: string;

  @ManyToOne(() => User, (user) => user.tasksCreated)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
