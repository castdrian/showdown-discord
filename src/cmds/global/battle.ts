import { CommandInteraction, MessageComponentInteraction, MessageActionRow, MessageButton, Message, MessageEmbed } from 'discord.js';
import { Command } from 'src/@types/Util';
import { Dex, Teams, TeamValidator, RandomPlayerAI, BattleStreams, PRNG } from '@pkmn/sim';
import { Protocol, Handler, ArgName, ArgType, BattleArgsKWArgType } from '@pkmn/protocol';
import { Battle, Side, Pokemon } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter, ChoiceBuilder } from '@pkmn/view';
import { Generations, GenerationNum } from '@pkmn/data';
import Util from '../../Util.js';

export async function run(interaction: CommandInteraction): Promise<void> {
    Teams.setGeneratorFactory(TeamGenerators);
    const dex = Dex.forFormat('gen8randombattle');
    const gens = new Generations(Dex as any);

    const spec = {formatid: 'gen8customgame'};

    const p1spec = { name: interaction.user.username, team: Teams.pack(Teams.generate('gen8randombattle')) };
    const p2spec = { name: 'Showdown!', team: Teams.pack(Teams.generate('gen8randombattle')) };

    const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

    const p2 = new RandomPlayerAI(streams.p2);
    void p2.start();

    const startrow = new MessageActionRow()
    .addComponents(new MessageButton().setStyle('PRIMARY').setLabel('Start battle').setCustomID('startbattle'));
    interaction.editReply('Battle format: `Gen 8 random singles battle`', { components: [startrow] }); 
	
	const message = await interaction.fetchReply() as Message;

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = message.createMessageComponentInteractionCollector(filter);
  let movebuttons: any = [];

	collector.on('collect', async (i: MessageComponentInteraction) => {
        await i.deferUpdate();
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

            streams.omniscient.write(`>start ${JSON.stringify(spec)}`);
            streams.omniscient.write(`>player p1 ${JSON.stringify(p1spec)}`);
            streams.omniscient.write(`>player p2 ${JSON.stringify(p2spec)}`);

            let state: any = {};
            void (async () => {
                for await (const chunk of streams.p1) {
                  if (chunk.startsWith('|error|')) {
                    console.error("\n" + chunk.substring(7) + "\n\n");
                  } else {
                    if (!chunk.startsWith('|request|')) {
                        //console.log(chunk);
                    } else {
                      state.request = JSON.parse(chunk.substring(9));
                      console.log(JSON.stringify(state.request, null, 2));
                      const activemon = state.request.side.pokemon[0];

                      const moverow = new MessageActionRow();
                      const optionsrow = new MessageActionRow()
                      .addComponents(
                        new MessageButton().setCustomID('forfeit').setLabel('Forfeit').setStyle('DANGER'),
                        new MessageButton().setCustomID('switch').setLabel('Switch').setStyle('SUCCESS'),
                      );

                      for (const move of activemon.moves) {
                        moverow.addComponents(new MessageButton().setCustomID(move).setLabel(move.charAt(0).toUpperCase() + move.slice(1)).setStyle('PRIMARY'));
                        movebuttons.push(move)
                      }

                      const monname = activemon.details.split(',')[0];
                      const hp = activemon.condition;

                      const embed = new MessageEmbed()
                      .setDescription('Your side:\n\n```md\n' + activemon.details + '\n' + activemon.condition + 'HP\n```')
                      .setAuthor('Showdown!', interaction.client.user?.displayAvatarURL())
                      .setFooter(`${monname} | ${hp}HP`, interaction.user.displayAvatarURL())
                      .setImage(`https://play.pokemonshowdown.com/sprites/ani-back/${monname.toLowerCase().trim()}.gif`);

                      await i.editReply({ embeds: [embed], components: [moverow, optionsrow] });
                    }
              
                    if (chunk.startsWith('|player|') || chunk.startsWith('|\n')) {
                      //console.log(chunk);
                      
                    }
            
                  }
                }
              })();
              

            //await i.update('Battle started. Check console.', { components: [] });
          }

          if (movebuttons.some((x: String) => x === i.customID)) {
            streams.p1.write(`>p1 move ${i.customID}`);
            await i.editReply('You chose ' + i.customID.charAt(0).toUpperCase() + i.customID.slice(1), { components: [] });
          }

          if (i.customID === 'forfeit') {
            await i.editReply('Battle cancelled. You lost.', { components: [] });
          }

          if (i.customID === 'switch') {
            await i.editReply('Check console. lol.', { components: [] });
          }
    });

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
