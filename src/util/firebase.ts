import type { LeaderboardEntry } from '#types/*';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp({
	credential: applicationDefault(),
	databaseURL: process.env.FIREBASE_URL
});

const db = getDatabase(app);
const statsRef = db.ref('stats');
const battlesRef = statsRef.child('battles');
const leaderboardRef = statsRef.child('leaderboard');

export async function readBattles(): Promise<number> {
	try {
		return battlesRef.once('value').then((snapshot) => snapshot.val());
	} catch (error) {
		console.error('read battles failed:', error);
		return 0;
	}
}

export async function incrementBattles(): Promise<void> {
	try {
		await battlesRef.transaction((current) => current + 1);
	} catch (error) {
		console.error('increment battles failed:', error);
	}
}

export async function readLeaderboard(): Promise<LeaderboardEntry[]> {
	try {
		const leaderboard = await leaderboardRef
			.orderByChild('wins')
			.limitToLast(10)
			.once('value')
			.then((snapshot) => {
				const leaderboardObject = snapshot.val() ?? {};
				const leaderboardArray = Object.values(leaderboardObject) as LeaderboardEntry[];
				leaderboardArray.sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
					if (a.wins === b.wins) {
						return a.losses - b.losses;
					}
					return b.wins - a.wins;
				});
				return leaderboardArray.slice(0, 10);
			});
		return leaderboard;
	} catch (error) {
		console.error('read leaderboard failed:', error);
		return [];
	}
}

export async function incrementOrCreateLeaderboardEntry(user_id: string, guild_id: string, type: 'win' | 'loss'): Promise<void> {
	try {
		const dbEntry = await leaderboardRef
			.orderByChild('user_id')
			.equalTo(user_id)
			.once('value')
			.then((snapshot) => snapshot.val());

		if (dbEntry) {
			const entryKey = Object.keys(dbEntry)[0];
			const entry = dbEntry[entryKey];
			await leaderboardRef.child(entryKey).update({
				wins: type === 'win' ? entry.wins + 1 : entry.wins,
				losses: type === 'loss' ? entry.losses + 1 : entry.losses,
				guild_id
			});
		} else {
			await leaderboardRef.push({
				user_id,
				guild_id,
				wins: type === 'win' ? 1 : 0,
				losses: type === 'loss' ? 1 : 0
			});
		}
	} catch (error) {
		console.error('increment or create leaderboard entry failed:', error);
	}
}
