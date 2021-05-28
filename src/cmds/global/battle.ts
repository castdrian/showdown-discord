import { MessageEmbed } from 'discord.js';
import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';
import { Command } from 'src/@types/Util';

export async function run(interaction: CommandInteraction): Promise<void> {

    const startrow = new MessageActionRow()
    .addComponent(new MessageButton().setStyle('PRIMARY').setLabel('Start battle'));
    return interaction.editReply('Battle format: `Gen 8 Random Singles Battle (OU)`', { components: [startrow] });       
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