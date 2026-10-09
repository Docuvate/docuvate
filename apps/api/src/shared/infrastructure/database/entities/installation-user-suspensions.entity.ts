import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity.js';

@Entity('installation_user_suspensions', { schema: 'public' })
export class InstallationUserSuspensionsEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @Column('text', { name: 'reason', nullable: true })
  reason: string | null;

  @Column('timestamp with time zone', {
    name: 'suspended_at',
    default: () => 'now()',
  })
  suspendedAt: Date;

  @Column('timestamp with time zone', { name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: UserEntity;
}
