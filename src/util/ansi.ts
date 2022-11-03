import type { Battle } from '@pkmn/client';
import { Dex, MoveName } from '@pkmn/dex';
import { Formatters } from 'discord.js';

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
	if (process.romaji && process.romajiMons && process.romajiMoves) {
		// replace all instances of the mons' names with their romaji names

		for (const mon of p1mons) {
			const romajiSpecies = process.romajiMons.find((r) => r.name.toLowerCase() === mon.baseSpeciesForme.toLowerCase())?.trademark;
			// const ident is originalIdent property, which looks like this originalIdent: 'p1: Sceptile', so we split it by the colon and take the second element
			const ident = mon.originalIdent.split(':')[1].trim();
			const romajiIdent = process.romajiMons.find((r) => r.name.toLowerCase() === ident.toLowerCase())?.trademark;
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
			const romajiSpecies = process.romajiMons.find((r) => r.name.toLowerCase() === mon.baseSpeciesForme.toLowerCase())?.trademark;
			// const ident is originalIdent property, which looks like this originalIdent: 'p1: Sceptile', so we split it by the colon and take the second element
			const ident = mon.originalIdent.split(':')[1].trim();
			const romajiIdent = process.romajiMons.find((r) => r.name.toLowerCase() === ident.toLowerCase())?.trademark;
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
	str = str.replace(/(Turn )(\d+)/g, `${WHITE_BOLD}$1$2${RESET}`);

	// format all moves from both active mons blue bold
	if (battle.p1.active[0]?.moves && battle.p2.active[0]?.moves) {
		const moveIDs = [...battle.p1.active[0].moves, ...battle.p2.active[0].moves].map((move) => move);
		const moveNames = moveIDs.map((move) => Dex.moves.get(move).name);

		for (let move of moveNames) {
			if (process.romaji && process.romajiMons && process.romajiMoves) {
				const romajiMove =
					(process.romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.replace(/\s/g, '').toLowerCase())
						?.romaji as MoveName) ?? move;
				str = str.replace(new RegExp(move, 'g'), romajiMove);
				move = romajiMove;
			}
			str = str.replace(new RegExp(move, 'g'), `${BLUE_BOLD}${move}${RESET}`);
		}
	}

	// format all abilities and base abilities from both teams green bold and items yellow bold respectively
	for (const mon of battle.p1.team) {
		if (mon) {
			const abilityID = mon.ability;
			const baseAbilityID = mon.baseAbility;
			const abilityName = Dex.abilities.get(abilityID).name;
			const baseAbilityName = Dex.abilities.get(baseAbilityID).name;

			if (abilityName && baseAbilityName) {
				// eslint-disable-next-line no-negated-condition
				if (abilityName !== baseAbilityName) {
					str = str.replace(new RegExp(abilityName, 'g'), `${GREEN_BOLD}${abilityName}${RESET}`);
					str = str.replace(new RegExp(baseAbilityName, 'g'), `${GREEN_BOLD}${baseAbilityName}${RESET}`);
				} else {
					str = str.replace(new RegExp(abilityName, 'g'), `${GREEN_BOLD}${abilityName}${RESET}`);
				}
			}

			const itemID = mon.item;
			const itemName = Dex.items.get(itemID).name;

			if (itemName) {
				str = str.replace(new RegExp(itemName, 'g'), `${YELLOW_BOLD}${itemName}${RESET}`);
			}
		}
	}

	for (const mon of battle.p2.team) {
		if (mon) {
			const abilityID = mon.ability;
			const baseAbilityID = mon.baseAbility;
			const abilityName = Dex.abilities.get(abilityID).name;
			const baseAbilityName = Dex.abilities.get(baseAbilityID).name;

			if (abilityName && baseAbilityName) {
				// eslint-disable-next-line no-negated-condition
				if (abilityName !== baseAbilityName) {
					str = str.replace(new RegExp(abilityName, 'g'), `${GREEN_BOLD}${abilityName}${RESET}`);
					str = str.replace(new RegExp(baseAbilityName, 'g'), `${GREEN_BOLD}${baseAbilityName}${RESET}`);
				} else {
					str = str.replace(new RegExp(abilityName, 'g'), `${GREEN_BOLD}${abilityName}${RESET}`);
				}
			}

			const itemID = mon.item;
			const itemName = Dex.items.get(itemID).name;

			if (itemName) {
				str = str.replace(new RegExp(itemName, 'g'), `${YELLOW_BOLD}${itemName}${RESET}`);
			}
		}
	}

	// format as ansi code block
	const result = Formatters.codeBlock('ansi', str);
	return result;
}
