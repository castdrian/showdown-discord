export const components = [
	{
		type: 1,
		components: [
			{
				type: 3,
				custom_id: 'format',
				options: [
					{
						label: '[Gen 9] Random Battle',
						value: 'gen9randombattle',
						description: 'Pokémon Scarlet & Violet',
						emoji: { name: 'sv', id: '1067031019741528124' }
					},
					{
						label: '[Gen 8] Random Battle',
						value: 'gen8randombattle',
						description: 'Pokémon Sword & Shield',
						emoji: { name: 'swsh', id: '949337411387793439' }
					},
					{
						label: '[Gen 7] Random Battle',
						value: 'gen7randombattle',
						description: 'Pokémon Sun & Moon',
						emoji: { name: 'sumo', id: '949337664065261588' }
					},
					{
						label: '[Gen 6] Random Battle',
						value: 'gen6randombattle',
						description: 'Pokémon X & Y',
						emoji: { name: 'xy', id: '949337456711446588' }
					},
					{
						label: '[Gen 5] Random Battle',
						value: 'gen5randombattle',
						description: 'Pokémon Black & White',
						emoji: { name: 'bw', id: '949337455729979402' }
					}
				],
				placeholder: 'Select Battle Format'
			}
		]
	},
	{
		type: 1,
		components: [
			{
				type: 2,
				custom_id: 'start',
				label: 'Start Battle',
				style: 1
			},
			{
				type: 2,
				custom_id: 'team',
				label: 'Import Team',
				style: 2
			},
			{
				type: 2,
				custom_id: 'romaji',
				label: 'Romaji: Off',
				style: 2
			},
			{
				type: 2,
				custom_id: 'cancel',
				label: 'Cancel',
				style: 4
			}
		]
	}
] as any;

export const modal = {
	title: 'Import Team',
	custom_id: 'team_import',
	components: [
		{
			type: 1,
			components: [
				{
					type: 4,
					custom_id: 'paste_url',
					label: 'pokepast.es URL',
					style: 1,
					min_length: 1,
					max_length: 100,
					placeholder: 'https://pokepast.es/...',
					required: true
				}
			]
		}
	]
} as any;
