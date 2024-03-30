import { component$ } from '@builder.io/qwik';

export default component$(() => (
	<div class="ml-4 flex-grow">
		<div class="relative">
			<input
				id="floating_outlined"
				class="border-1 peer block h-10 w-full appearance-none rounded-xl border-gray-300 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500"
				name="message"
				type="text"
				placeholder=" "
				spellcheck={true}
				autoCapitalize="on"
				// @ts-ignore
				autocorrect="on"
				enterKeyHint="send"
			/>
			<label for="floating_outlined" class="absolute start-1 top-2 z-10 origin-[0] -translate-y-3 scale-75 transform bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4 dark:bg-gray-800 dark:text-gray-400 peer-focus:dark:text-blue-500">
				Ask me anything
			</label>
		</div>
	</div>
));