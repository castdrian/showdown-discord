import { Listener } from '@sapphire/framework';

export class ExceptionListener extends Listener {
	public run(err: Error): void {
		this.container.logger.error(`Uncaught Exception: ${err.stack}`);
	}
}
