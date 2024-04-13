import { createContextId, type Signal } from '@builder.io/qwik';
import type { IDBConversation, IDBMessage } from '../IDB/schemas/v2';

export const ConversationsContext = createContextId<Signal<IDBConversation[]>>('ConversationsContext');
export const MessagesContext = createContextId<Record<NonNullable<IDBMessage['key']>, IDBMessage>>('MessagesContext');
