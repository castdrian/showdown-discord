import { config } from 'dotenv';
import '@sapphire/plugin-logger/register';
import { LogLevel, SapphireClient } from '@sapphire/framework';

config();

const client = new SapphireClient({
	shards: 'auto',
	intents: ['GUILDS'],
	logger: {
		level: LogLevel.Debug
	}
});

await client.login();
