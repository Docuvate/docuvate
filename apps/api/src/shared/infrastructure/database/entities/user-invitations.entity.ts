// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from './user.entity.js';

@Index('user_invitations_token_hash_idx', ['tokenHash'], { unique: true })
@Entity('user_invitations', { schema: 'public' })
export class UserInvitationsEntity {
  @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
  id: string;

  @Column('text', { name: 'invited_by_user_id' })
  invitedByUserId: string;

  @Column('text', { name: 'invitee_email' })
  inviteeEmail: string;

  @Column('text', { name: 'invitee_name' })
  inviteeName: string;

  @Column('text', { name: 'assigned_role', default: () => "'installation_member'" })
  assignedRole: string;

  @Column('text', { name: 'token_hash' })
  tokenHash: string;

  @Column('timestamp with time zone', { name: 'expires_at' })
  expiresAt: Date;

  @Column('timestamp with time zone', { name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column('timestamp with time zone', { name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @Column('timestamp with time zone', {
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn([{ name: 'invited_by_user_id', referencedColumnName: 'id' }])
  invitedByUser: UserEntity;
}
