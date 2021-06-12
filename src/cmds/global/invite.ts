import { ApplicationCommandData, CommandInteraction, MessageButton } from 'discord.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
    const url = 'https://discord.com/api/oauth2/authorize?client_id=847595833347801118&permissions=0&scope=applications.commands%20bot';

    const button = new MessageButton().setStyle('LINK').setLabel('Invite me').setURL(url);
    return interaction.editReply({ content: 'Oauth2 invite:', components: [[button]] });  
}

export const data: ApplicationCommandData = {
    name: 'invite',
    description: 'Invite Showdown!'
};