import type { MessageEditOptions } from 'discord.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const waitFor = async function waitFor(f: any) {
	while (!f()) await sleep(1000);
	return f();
};

export const fixCustomId = (components: any): MessageEditOptions['components'] => {
	// now, replace every custom_id with its own value concatenated with a unique id per component

	// first, generate a unique id for each component
	const componentsWithIds = components.map((c: any) => {
		if (c.type === 1) {
			return {
				...c,
				components: c.components.map((c: any) => {
					return {
						...c,
						// generate unique numerical id
						uniqueId: Math.floor(Math.random() * 100000000000000000)
					};
				})
			};
		}
		return {
			...c,
			// generate unique numerical snowflake
			uniqueId: Math.floor(Math.random() * 100000000000000000)
		};
	});

	// now, replace every custom_id with its own value concatenated with a unique id per component
	const fixedComponents = componentsWithIds.map((c: any) => {
		if (c.type === 1) {
			return {
				...c,
				components: c.components.map((c: any) => {
					return {
						...c,
						custom_id: c.custom_id + c.uniqueId
					};
				})
			};
		}
		return {
			...c,
			custom_id: c.custom_id + c.uniqueId
		};
	});
	return fixedComponents;
};

// function to get the original custom_id from the modified one
export const getCustomId = (customId: string) => {
	// the unique id is produced by BigInt(Date.now()).toString(2)
	// so now we match all the numbers in the string and remove them since our custom_id doesn't contain any numbers
	return customId.replace(/[0-9]/g, '');
};
