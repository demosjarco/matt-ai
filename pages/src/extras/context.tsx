import { createContextId, type Signal } from '@builder.io/qwik';
import type { IDBConversation } from '../IDB/schemas/v2';

export const ConversationsContext = createContextId<Signal<IDBConversation[]>>('ConversationsContext');
