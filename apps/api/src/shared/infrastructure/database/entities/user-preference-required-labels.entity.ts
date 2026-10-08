import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TagsEntity } from './tags.entity.js';
import { UserPreferencesEntity } from './user-preferences.entity.js';

@Index('user_preference_required_labels_tag_idx', ['tagId'], {})
@Entity('user_preference_required_labels', { schema: 'public' })
export class UserPreferenceRequiredLabelsEntity {
  @PrimaryColumn('text', { name: 'user_id' })
  userId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => UserPreferencesEntity, (prefs) => prefs.requiredLabels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'userId' }])
  userPreferences: UserPreferencesEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
