import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity.js';

@Index('twoFactor_userId_idx', ['userId'])
@Entity('twoFactor', { schema: 'public' })
export class TwoFactorEntity {
  @PrimaryColumn('text', { name: 'id' })
  id: string;

  @Column('text', { name: 'userId' })
  userId: string;

  @Column('text', { name: 'secret' })
  secret: string;

  @Column('text', { name: 'backupCodes' })
  backupCodes: string;

  @Column('boolean', { name: 'verified', default: () => 'true' })
  verified: boolean;

  @Column('integer', { name: 'failedVerificationCount', default: () => '0' })
  failedVerificationCount: number;

  @Column('timestamp with time zone', { name: 'lockedUntil', nullable: true })
  lockedUntil: Date | null;

  @Column('timestamp with time zone', {
    name: 'createdAt',
    default: () => 'now()',
  })
  createdAt: Date;

  @Column('timestamp with time zone', {
    name: 'updatedAt',
    default: () => 'now()',
  })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: UserEntity;
}
