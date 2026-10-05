import { redirect } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { db } from '$lib/server/db.js';

export async function POST({ cookies }) {
    // Session-Token aus dem Cookie lesen
    const token = cookies.get('session');

    // Die aktuelle Session aus der Datenbank löschen
    if (token) {
        // Token hashen, um die gespeicherte Session zu finden
        const tokenHash = createHash('sha256')
            .update(token)
            .digest('hex');

        await db.execute(
            'DELETE FROM sessions WHERE token_hash = ?',
            [tokenHash]
        );
    }

    // Cookies im Browser entfernen
    cookies.delete('session', { path: '/' });
    cookies.delete('challenge', { path: '/' });

    // Zur Anmeldung zurückkehren
    redirect(303, '/login');
}