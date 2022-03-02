import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { versusScreen } from '#util/canvas';

export class Battle extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();

		const embeds = [
			{
				title: 'Pokémon Showdown! Battle',
				thumbnail: { url: this.container.client.user?.displayAvatarURL() },
				description: `Format: \`Random Battle (Gen 8)\`\nPlayers: \`${interaction.user.username}\` vs. \`${this.container.client.user?.username}\``,
				color: '0x5865F2',
				image: { url: 'attachment://versus.png' }
			}
		] as any;

		const components = [
			{
				type: 3,
				custom_id: 'format',
				options: [{ label: 'Random Battle (Gen 8)', value: 'gen8randombattle' }],
				placeholder: 'Random Battle (Gen 8)',
				disabled: true
			},
			{
				type: 2,
				custom_id: 'start',
				label: 'Start Battle',
				style: 1
			}
		].map((c) => ({ type: 1, components: [c] }));

		const image = await versusScreen(interaction);
		const files = [{ attachment: image, name: 'versus.png' }];

		await interaction.editReply({ embeds, components, files });
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: 'Start a Showdown! battle'
			},
			{
				guildIds: ['709061970078335027'],
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		);
	}
}
