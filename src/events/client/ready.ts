/* eslint-disable no-param-reassign */
import { Client, ClientApplication, User, Team } from 'discord.js';
import LCL from 'last-commit-log';
import Util from '../../Util.js';

export default {
  name: 'ready',
  once: true,
  async run(showdown: Client): Promise<void> {
    const app = await showdown.application
      ?.fetch()
      .catch((x) => Util.log(`Failed to fetch owner: ${x}`));
    if (
      app &&
      app instanceof ClientApplication &&
      app.owner &&
      app.owner instanceof User
    )
      showdown.owner = app.owner.id;
    else if (
      app &&
      app instanceof ClientApplication &&
      app.owner &&
      app.owner instanceof Team
    )
      showdown.owner = app.owner.ownerID as string;

    await Util.LoadCommands();
    await Util.DeployCommands();
    showdown.user?.setActivity('Showdown!', { type: 'PLAYING' });

    console.log('Ready!');

    const lcl = new LCL('../');
    const commit = await lcl.getLastCommit();
    if (commit)
      Util.log(
        `Logged in as \`${process.showdown.user?.tag}\`.\n[#${commit.shortHash}](<${commit.gitUrl}/commit/${commit.hash}>) - \`${commit.subject}\` by \`${commit.committer.name}\` on branch [${commit.gitBranch}](<${commit.gitUrl}/tree/${commit.gitBranch}>).`
      );
  },
};
