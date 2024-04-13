import { component$ } from '@builder.io/qwik';
import InteractionBar from './interactionBar';
import MessageList from './messageList';

export default component$(() => {
	return (
		<>
			<div class="flex h-screen flex-auto flex-shrink-0 flex-col justify-between pt-12 sm:pt-0">
				<div class="flex flex-col overflow-x-auto">
					<div class="flex flex-col">
						<MessageList />
					</div>
				</div>
				<InteractionBar />
			</div>
		</>
	);
});
