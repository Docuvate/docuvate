import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SavedDocumentViewsEntity } from './saved-document-views.entity.js';
import { TagsEntity } from './tags.entity.js';

@Entity('saved_document_view_tags', { schema: 'public' })
export class SavedDocumentViewTagsEntity {
  @PrimaryColumn('uuid', { name: 'view_id' })
  viewId: string;

  @PrimaryColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @ManyToOne(() => SavedDocumentViewsEntity, (view) => view.viewTags, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'view_id', referencedColumnName: 'id' }])
  view: SavedDocumentViewsEntity;

  @ManyToOne(() => TagsEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'tag_id', referencedColumnName: 'id' }])
  tag: TagsEntity;
}
