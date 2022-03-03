import { Util } from 'discord.js';

export function displayLog(text: string) {
	console.log(Util.escapeMarkdown(text));
}
