import Util from '../../Util.js';
import { Interaction } from 'discord.js';

export default {
    name: 'interaction',
    async run(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;
        if (!interaction.guild) return interaction.reply({ content: 'DM commands are not supported!', ephemeral: true });
        Util.Interactions.SlashCommands(interaction);
    }
};