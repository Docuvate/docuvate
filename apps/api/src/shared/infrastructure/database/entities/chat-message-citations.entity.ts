import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ChatMessagesEntity } from './chat-messages.entity.js';
import { DocumentTextChunksEntity } from './document-text-chunks.entity.js';

@Index('chat_message_citations_chunk_id_idx', ['chunkId'], {})
@Entity('chat_message_citations', { schema: 'public' })
export class ChatMessageCitationsEntity {
  @PrimaryColumn('uuid', { name: 'message_id' })
  messageId: string;

  @PrimaryColumn('integer', { name: 'ordinal' })
  ordinal: number;

  @Column('uuid', { name: 'chunk_id' })
  chunkId: string;

  @Column('text', { name: 'quote' })
  quote: string;

  @Column('integer', { name: 'char_start' })
  charStart: number;

  @Column('integer', { name: 'char_end' })
  charEnd: number;

  @ManyToOne(() => ChatMessagesEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'message_id', referencedColumnName: 'id' }])
  message: ChatMessagesEntity;

  @ManyToOne(() => DocumentTextChunksEntity, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'chunk_id', referencedColumnName: 'id' }])
  chunk: DocumentTextChunksEntity;
}
