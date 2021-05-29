import { CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton, Message, MessageEmbed } from 'discord.js';
import { Command } from 'src/@types/Util';
import { Dex, Teams, TeamValidator, RandomPlayerAI, BattleStreams, PRNG } from '@pkmn/sim';
import { Protocol, Handler, ArgName, ArgType, BattleArgsKWArgType } from '@pkmn/protocol';
import { Battle, Side, Pokemon } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter } from '@pkmn/view';
import { Generations, GenerationNum } from '@pkmn/data';

export async function run(interaction: CommandInteraction): Promise<void> {
    Teams.setGeneratorFactory(TeamGenerators);
    const dex = Dex.forFormat('gen8randombattle');
    const gens = new Generations(Dex as any);

    const spec = {formatid: 'gen8customgame'};

    const p1spec = {name: interaction.user.username, team: Teams.pack(Teams.generate('gen8randombattle'))};
    const p2spec = {name: 'Showdown!', team: Teams.pack(Teams.generate('gen8randombattle'))};

    const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

    const p1 = new RandomPlayerAI(streams.p1);
    const p2 = new RandomPlayerAI(streams.p2);

    void p1.start();
    void p2.start();

    const startrow = new MessageActionRow()
    .addComponents([new MessageButton().setStyle('PRIMARY').setLabel('Start battle').setCustomID('startbattle')]);
    interaction.editReply('Battle format: `Gen 8 random singles battle (OU)`', { components: [startrow] }); 
	
	const message = await interaction.fetchReply() as Message;

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;

	const collector = message.createMessageComponentInteractionCollector(filter);

	collector.on('collect', async (i: MessageComponentInteraction) => {
        if (i.customID === 'startbattle') {
            const battle = new Battle(gens);
            const formatter = new LogFormatter('p1', battle);

            const pre = new PreHandler(battle);
            const post = new PostHandler(battle);

            const add = <T>(h: Handler<T>, k: ArgName | undefined, a: ArgType, kw: BattleArgsKWArgType) => {
                if (k && k in h) (h as any)[k](a, kw);
            };

            void (async () => {
                for await (const chunk of streams.omniscient) {
                  console.log(chunk);
              
                  for (const line of chunk.split('\n')) {
                    const {args, kwArgs} = Protocol.parseBattleLine(line);
                    const log = formatter.formatText(args, kwArgs);
                    const key = Protocol.key(args);
              
                    add(pre, key, args, kwArgs);
                    battle.add(args, kwArgs);
                    add(post, key, args, kwArgs);
              
                    displayLog(log);
                  }
                  battle.update();
                }
            })();

            void (async () => {
                for await (const chunk of streams.spectator) {
                  console.log(chunk);
              
                  for (const line of chunk.split('\n')) {
                    const {args, kwArgs} = Protocol.parseBattleLine(line);
                    const log = formatter.formatText(args, kwArgs);
                    const key = Protocol.key(args);
              
                    add(pre, key, args, kwArgs);
                    battle.add(args, kwArgs);
                    add(post, key, args, kwArgs);
              
                    displayLog(log);
                  }
                  battle.update();
                }
            })();
            void streams.omniscient.write(`>start ${JSON.stringify(spec)}
            >player p1 ${JSON.stringify(p1spec)}
            >player p2 ${JSON.stringify(p2spec)}`);

            await i.update('Battle started. Check console.', { components: [] });
        }
    });

	//collector.on('end', collected => console.log(`Collected ${collected.size} items`));

    const displayLog = (log: string) => {
        if (!log) return;
        console.log(log);
    };
      
    const displayTeam = (side: Side) => {
    };
      
    const displayPokemon = (pokemon: Pokemon | null) => {
    if (pokemon) {
    }
    };
      
    class PreHandler implements Handler<void> {
    constructor(private readonly battle: Battle) {
        this.battle = battle;
    }
    
    '|faint|'(args: Protocol.Args['|faint|']) {
    }
    }
      
    class PostHandler implements Handler<void> {
    constructor(private readonly battle: Battle) {
        this.battle = battle;
    }
    
    '|teampreview|'() {
    }
    
    '|turn|'() {
        
    }
    }
}

export const info: Command['info'] = {
    roles: [],
    user_perms: [],
    bot_perms: []
};

export const data: Command['data'] = {
    name: 'battle',
    description: 'Start a battle simulation'
};
