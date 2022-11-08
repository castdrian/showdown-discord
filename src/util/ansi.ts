import { shortTypes } from '#constants/emotes';
import type { Battle, Side } from '@pkmn/client';
import { Dex, MoveName } from '@pkmn/dex';
import { codeBlock } from 'discord.js';
import type { RomajiMon, RomajiMove } from 'pkmn-romaji';
import { cache } from '#util/cache';

const RED_BOLD = '\u001b[1;31m';
const BLUE_BOLD = '\u001b[1;34m';
const GREEN_BOLD = '\u001b[1;32m';
const YELLOW_BOLD = '\u001b[1;33m';
const MAGENTA_BOLD = '\u001b[1;35m';
const CYAN_BOLD = '\u001b[1;36m';
const WHITE_BOLD = '\u001b[1;37m';
const RESET = '\u001b[0m';

export function formatBattleLog(log: string[], battle: Battle): string {
	// cut down log to last 10 lines
	// if there are more than 2 linebreaks in a row, replace them with 2 linebreaks
	let str = log
		.slice(-10)
		.join('\n')
		.replace(/\n{3,}/g, '\n\n');

	// grab text that is engulfed in three pairs of pipes like "||27/278||9.7%||" and replace it with a formatted string
	str = str.replace(/\|\|(\d+\/\d+)\|\|(\d+\.?\d*%)\|\|/g, (_match, _hp, percent) => `${MAGENTA_BOLD}${percent}${RESET}`);

	// repeat this for the same text if it has negative numbers in it like "||−18/297||6.1%||"
	str = str.replace(/\|\|−(\d+\/\d+)\|\|(\d+\.?\d*%)\|\|/g, (_match, _hp, percent) => `${MAGENTA_BOLD}${percent}${RESET}`);

	// use ansi escape codes to format every instance the names of the active mons red bold
	const p1mons = battle.p1.team;
	const p1romajimons = [];
	const p2mons = battle.p2.team;
	const p2romajimons = [];

	// apply romaji mode if it is enabled
	const romaji = cache.get('romaji');
	const romajiMons: RomajiMon[] = cache.get('romajimons')!;
	const romajiMoves: RomajiMove[] = cache.get('romajimoves')!;

	if (romaji && romajiMons && romajiMoves) {
		// replace all instances of the mons' names with their romaji names

		for (const mon of p1mons) {
			const romajiSpecies = romajiMons.find((r) => r.name.toLowerCase() === mon.baseSpeciesForme.toLowerCase())?.trademark;
			// const ident is originalIdent property, which looks like this originalIdent: 'p1: Sceptile', so we split it by the colon and take the second element
			const ident = mon.originalIdent.split(':')[1].trim();
			const romajiIdent = romajiMons.find((r) => r.name.toLowerCase() === ident.toLowerCase())?.trademark;
			if (romajiSpecies) {
				str = str.replace(new RegExp(mon.baseSpeciesForme, 'g'), romajiSpecies);
				p1romajimons.push(romajiSpecies);
			}
			if (romajiIdent) {
				str = str.replace(new RegExp(ident, 'g'), romajiIdent);
				p1romajimons.push(romajiIdent);
			}
		}

		for (const mon of p2mons) {
			const romajiSpecies = romajiMons.find((r) => r.name.toLowerCase() === mon.baseSpeciesForme.toLowerCase())?.trademark;
			// const ident is originalIdent property, which looks like this originalIdent: 'p1: Sceptile', so we split it by the colon and take the second element
			const ident = mon.originalIdent.split(':')[1].trim();
			const romajiIdent = romajiMons.find((r) => r.name.toLowerCase() === ident.toLowerCase())?.trademark;
			if (romajiSpecies) {
				str = str.replace(new RegExp(mon.baseSpeciesForme, 'g'), romajiSpecies);
				p2romajimons.push(romajiSpecies);
			}
			if (romajiIdent) {
				str = str.replace(new RegExp(ident, 'g'), romajiIdent);
				p2romajimons.push(romajiIdent);
			}
		}
	}

	// replace all mon names and all romaji mon names with red bold names
	for (const mon of p1mons) {
		const ident = mon.originalIdent.split(':')[1].trim();
		str = str.replace(new RegExp(mon.baseSpeciesForme, 'g'), `${RED_BOLD}${mon.baseSpeciesForme}${RESET}`);
		str = str.replace(new RegExp(ident, 'g'), `${RED_BOLD}${ident}${RESET}`);
	}

	for (const mon of p2mons) {
		const ident = mon.originalIdent.split(':')[1].trim();
		str = str.replace(new RegExp(mon.baseSpeciesForme, 'g'), `${RED_BOLD}${mon.baseSpeciesForme}${RESET}`);
		str = str.replace(new RegExp(ident, 'g'), `${RED_BOLD}${ident}${RESET}`);
	}

	for (const romaji of p1romajimons) {
		str = str.replace(new RegExp(romaji, 'g'), `${RED_BOLD}${romaji}${RESET}`);
	}

	for (const romaji of p2romajimons) {
		str = str.replace(new RegExp(romaji, 'g'), `${RED_BOLD}${romaji}${RESET}`);
	}

	// format the player names cyan bold
	str = str.replace(new RegExp(battle.p1.name, 'g'), `${CYAN_BOLD}${battle.p1.name}${RESET}`);
	str = str.replace(new RegExp(battle.p2.name, 'g'), `${CYAN_BOLD}${battle.p2.name}${RESET}`);

	// format turn and turn number white bold
	str = str.replace(/(Turn )(\d+)/g, `== ${WHITE_BOLD}$1$2${RESET}`);

	// format 'Z-Move' blue bold
	str = str.replace(/(Z-Move)/g, `${BLUE_BOLD}$1${RESET}`);

	// format all moves blue bold
	for (const move of Dex.moves.all()) {
		if (romaji && romajiMons && romajiMoves) {
			const romajiMove =
				romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.name.replace(/\s/g, '').toLowerCase())?.romaji ?? move.name;
			str = str.replace(new RegExp(move.name, 'g'), romajiMove);
			move.name = romajiMove as MoveName;
		}
		str = str.replace(new RegExp(move.name, 'g'), `${BLUE_BOLD}${move.name}${RESET}`);
	}

	// // format all abilities green bold
	for (const ability of Dex.abilities.all()) {
		str = str.replace(new RegExp(ability.name, 'g'), `${GREEN_BOLD}${ability.name}${RESET}`);
	}

	// format all items yellow bold
	for (const item of Dex.items.all()) {
		str = str.replace(new RegExp(item.name, 'g'), `${YELLOW_BOLD}${item.name}${RESET}`);
	}

	// split by linebreaks
	const lines = str.split('\n');
	// if the same mon was withdrawn and sent out in the same turn: '<player> withdrew Avalugg!\n<player> sent out Avalugg!' -> '<player> sent out Avalugg!' remove the withdrew line
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].includes(' withdrew ') && lines[i + 1]?.includes(' sent out ')) {
			lines.splice(i, 1);
		}
	}

	// join the lines back together
	str = lines.join('\n');

	// format as ansi code block
	const result = codeBlock('ansi', str);
	return result;
}

export function generateSideState(side: Side) {
	const mon = side.active[0] ?? side.lastPokemon;
	if (!mon) return '';

	// function to calculate hp color based on percentage
	const hpColor = (hp: number, maxhp: number) => {
		const ratio = hp / maxhp;
		if (ratio > 0.5) return GREEN_BOLD;
		if (ratio > 0.2) return YELLOW_BOLD;
		return RED_BOLD;
	};

	const HP_COLORS = {
		g: GREEN_BOLD,
		y: YELLOW_BOLD,
		r: RED_BOLD,
		// if empty string, calculate color based on percentage
		'': hpColor(mon.hp, mon.maxhp)
	};

	const STATUS_COLORS = {
		brn: RED_BOLD,
		par: YELLOW_BOLD,
		psn: MAGENTA_BOLD,
		tox: MAGENTA_BOLD,
		slp: BLUE_BOLD,
		frz: CYAN_BOLD
	};

	const status = mon.status ? `${STATUS_COLORS[mon.status] + mon.status.toUpperCase() + RESET} ` : '';
	const HP_COLOR = HP_COLORS[mon.hpcolor];

	// grab mon from dex and get types from there
	const { types } = Dex.species.get(mon.baseSpeciesForme);

	// get the mons types and format them to look like (type1/type2) if it has 2 types, otherwise just (type1)
	const parsedTypes = types.map((type) => shortTypes[type.toLowerCase()]).join('/');
	const typesString = `(${parsedTypes})`;

	const monString = `${WHITE_BOLD}${mon.name}${RESET} ${HP_COLOR}${mon.hp}${RESET}/${HP_COLOR}${mon.maxhp}${RESET} ${WHITE_BOLD}HP${RESET} ${
		mon.status ? status : ''
	}${typesString}`;
	const ansi = codeBlock('ansi', monString);

	const normalBall = '<:normalball:1037794399347822622>';
	const statusBall = '<:statusball:1037794402657128570>';
	const faintedBall = '<:faintedball:1037794395908477029>';

	const teamStatusString = side.team
		.map((mon) => {
			if (mon.fainted) return faintedBall;
			if (mon.status) return statusBall;
			return normalBall;
		})
		// if side.n is 1 and side.team.length is less than 6, add normal balls to fill up the rest of the team
		.concat(Array(side.n === 1 && side.team.length < 6 ? 6 - side.team.length : 0).fill(normalBall))
		.join(' ');

	// if side is not player swap order
	if (side.n === 1) return `${teamStatusString}\n${ansi}`;
	return `${ansi}\n${teamStatusString}`;
}
