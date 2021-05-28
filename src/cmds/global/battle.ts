import { CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton, Message, MessageEmbed } from 'discord.js';
import { Command } from 'src/@types/Util';
export async function run(interaction: CommandInteraction): Promise<void> {

    const startrow = new MessageActionRow()
    .addComponent(new MessageButton().setStyle('PRIMARY').setLabel('Start battle').setCustomID('startbattle'));
    interaction.editReply('Battle format: `Gen 8 Random Singles Battle (OU)`', { components: [startrow] }); 
	
	const message = await interaction.fetchReply() as Message;

	const filter = (i: MessageComponentInteraction) => i.customID === 'startbattle' && i.user.id === interaction.user.id;

	message.awaitMessageComponentInteractions(filter, { time: 15000, maxComponents: 1 })
	.then(x => x.first()?.update('Battle started.', { components: []}))
	.catch(console.error);
}

export const info: Command['info'] = {
    roles: [],
    user_perms: [],
    bot_perms: []
};

export const data: Command['data'] = {
    name: 'battle',
    description: 'Start a battle simulation'
};