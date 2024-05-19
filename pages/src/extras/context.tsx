import { createContextId } from '@builder.io/qwik';
import type { IDBConversation, IDBMessage } from '../IDB/schemas/v2';

export const ConversationsContext = createContextId<IDBConversation[]>('ConversationsContext');
export const MessagesContext = createContextId<Record<NonNullable<IDBMessage['key']>, IDBMessage>>('MessagesContext');
