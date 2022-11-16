import { Listener } from '@sapphire/framework';
import { codeBlock, inlineCode, Message } from 'discord.js';

export class MessageListener extends Listener {
	public async run(message: Message) {
		const owner = this.container.client.application?.owner?.id;
		if (owner && message.author.id === owner && message.mentions.has(this.container.client.user!)) {
			// remove the client mention
			const content = message.content.replace(new RegExp(`<@!?${this.container.client.user!.id}>`), '').trim();

			// evaluate the content resolving promises if needed and send the result
			// eslint-disable-next-line no-eval
			const evaluation = new Promise((resolve) => resolve(eval(`(async () => { ${content} })()`)));
			let result = await evaluation.catch((error) => error);
			if (result instanceof Promise) result = await result.catch((error) => error);

			const type = typeof result;
			const value = result instanceof Error ? result.message : `${result}`;

			// format pretty
			const formatted = `**Type**: ${inlineCode(type)}\n**Value**:\n${codeBlock('js', value)}`;
			await message.channel.send(formatted).catch(() => null);
		}
	}
}
