import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';
import { Command } from 'src/@types/Util';

export async function run(interaction: CommandInteraction): Promise<void> {
    const url = 'https://discord.com/api/oauth2/authorize?client_id=847595833347801118&permissions=0&scope=applications.commands%20bot';

    const row = new MessageActionRow()
    .addComponent(new MessageButton().setStyle('LINK').setLabel('Invite me').setURL(url));
    return interaction.editReply('Oauth2 invite:', { components: [row] });       
}

export const info: Command['info'] = {
    roles: [],
    user_perms: [],
    bot_perms: []
};

export const data: Command['data'] = {
    name: 'invite',
    description: 'Invite Showdown!'
};