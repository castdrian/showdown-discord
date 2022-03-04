import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import type { CommandInteraction, MessageComponentInteraction } from 'discord.js';
import { initiateBattle } from '#handlers/simulation';
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
				type: 1,
				components: [
					{
						type: 3,
						custom_id: 'format',
						options: [{ label: 'Random Battle (Gen 8)', value: 'gen8randombattle' }],
						placeholder: 'Random Battle (Gen 8)',
						disabled: true
					}
				]
			},
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: 'start',
						label: 'Start Battle',
						style: 1
					},
					{
						type: 2,
						custom_id: 'team',
						label: 'Custom Team',
						style: 2,
						disabled: true
					},
					{
						type: 2,
						custom_id: 'cancel',
						label: 'Cancel',
						style: 4
					}
				]
			}
		];

		const image = await versusScreen(interaction);
		const files = [{ attachment: image, name: 'versus.png' }];

		await interaction.editReply({ embeds, components, files });

		const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
		const collector = interaction.channel!.createMessageComponentCollector({ filter });

		collector.on('collect', async (i) => {
			if (i.customId === 'start') {
				await i.deferUpdate();
				collector.stop();
				await initiateBattle(interaction);
			}
			if (i.customId === 'cancel') {
				const embeds = [
					{
						title: 'Pokémon Showdown! Battle',
						thumbnail: { url: this.container.client.user?.displayAvatarURL() },
						description: '`Battle cancelled`',
						color: '0x5865F2'
					}
				] as any;

				await interaction.editReply({ embeds, components: [], files: [] });
				collector.stop();
			}
		});
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
