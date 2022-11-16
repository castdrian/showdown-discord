import { ApplyOptions } from '@sapphire/decorators';
import { ListenerOptions, Listener } from '@sapphire/framework';
import { ActivityType } from 'discord.js';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
	public async run() {
		await this.container.client.application?.fetch();
		setInterval(() => this.container.client.user?.setActivity({ type: ActivityType.Playing, name: 'Pokémon Showdown!' }), 30e3);
		this.container.logger.info('Ready!');
	}
}
