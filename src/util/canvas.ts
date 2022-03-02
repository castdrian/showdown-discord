import type { CommandInteraction } from 'discord.js';
import { Canvas, loadImage } from 'skia-canvas';

export async function versusScreen(interaction: CommandInteraction): Promise<Buffer> {
	const canvas = new Canvas(3500, 1968);
	const ctx = canvas.getContext('2d');

	const bg = await loadImage('./data/images/versus.png');
	const userAvatar = await loadImage(interaction.user.displayAvatarURL({ format: 'png' }));
	// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
	const opponentAvatar = await loadImage(interaction.client.user?.displayAvatarURL({ format: 'png' })!);

	ctx.drawImage(bg, 0, 0);
	ctx.drawImage(userAvatar, 350, 400, 1000, 1000);
	ctx.drawImage(opponentAvatar, 2150, 350, 1000, 1000);

	const buffer = await canvas.toBuffer('png');
	return buffer;
}
