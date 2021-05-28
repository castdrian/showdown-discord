import Util from '../../Util.js';
import { Client } from 'discord.js';

export default {
    name: 'shardReady',
    async run(id: number, unavailableGuilds: Set<string>, gideon: Client): Promise<void> {
        if (!unavailableGuilds) Util.log(`Shard \`${id}\` is connected!`);
        else Util.log(`Shard \`${id}\` is connected!\n\nThe following guilds are unavailable due to a server outage:\n\`\`\`\n${Array.from(unavailableGuilds).join('\n')}\n\`\`\``);
    }
};