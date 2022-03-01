import { ApplyOptions } from '@sapphire/decorators';
import { ListenerOptions, Listener } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({ once: true })
export class ReadyListener extends Listener {
	public run() {
		setInterval(() => this.container.client.user?.setActivity({ type: 'PLAYING', name: 'Pokémon Showdown!' }), 30e3);
		this.container.logger.info('Ready!');
	}
}
