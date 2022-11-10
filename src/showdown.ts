import { config } from 'dotenv';
import { GatewayIntentBits } from 'discord.js';
import '@sapphire/plugin-logger/register';
import { LogLevel, SapphireClient } from '@sapphire/framework';

config();

const client = new SapphireClient({
	shards: 'auto',
	intents: [GatewayIntentBits.Guilds],
	logger: {
		level: LogLevel.Debug
	}
});

if (!process.env.DISCORD_TOKEN) process.exit(0);

// attach global rejection handler and global uncaught exception handler
process.on('unhandledRejection', (err) => console.log(err));
process.on('uncaughtException', (err) => console.log(err));

await client.login();
