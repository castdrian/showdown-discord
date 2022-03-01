import { Listener } from '@sapphire/framework';

export class ShardListener extends Listener {
	public run(id: number) {
		console.log(`Shard ${id} is connected!`);
	}
}
