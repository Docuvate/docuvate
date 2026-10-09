import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SftpIngressAccountsEntity } from './sftp-ingress-accounts.entity.js';
import { TagsEntity } from './tags.entity.js';

@Index('sftp_ingress_account_labels_pkey', ['accountId', 'tagId'], {
  unique: true,
})
@Index('sftp_ingress_account_labels_tag_idx', ['tagId'], {})
@Entity('sftp_ingress_account_labels', { schema: 'public' })
export class SftpIngressAccountLabelsEntity {
  @PrimaryColumn('uuid', { name: 'account_id' })
  accountId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => SftpIngressAccountsEntity, (account) => account.accountLabels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'account_id', referencedColumnName: 'id' }])
  account: SftpIngressAccountsEntity;

  @ManyToOne(() => TagsEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
