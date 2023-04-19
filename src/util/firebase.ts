import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp({
	credential: applicationDefault(),
	databaseURL: process.env.FIREBASE_URL
});

const db = getDatabase(app);
const statsRef = db.ref('stats');
const battlesRef = statsRef.child('battles');

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
