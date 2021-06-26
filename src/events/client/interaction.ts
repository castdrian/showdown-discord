import { Interaction } from 'discord.js';
import Util from '../../Util.js';

export default {
  name: 'interaction',
  async run(interaction: Interaction): Promise<void> {
    if (!interaction.isCommand()) return;
    if (!interaction.guild)
      interaction.reply({
        content: 'DM commands are not supported!',
        ephemeral: true,
      });
    Util.Interactions.SlashCommands(interaction);
  },
};
