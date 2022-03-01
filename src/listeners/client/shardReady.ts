import { Listener } from '@sapphire/framework';

export class ShardListener extends Listener {
	public run(id: number) {
		this.container.logger.info(`Shard ${id} is connected!`);
	}
}
