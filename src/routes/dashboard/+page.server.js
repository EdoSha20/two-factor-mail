import { redirect } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { db } from '$lib/server/db.js';

export async function load({ cookies }) {
    const token = cookies.get('session');

    // Ohne gültiges Session-Cookie zurück zur Anmeldung
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        redirect(303, '/login');
    }

    const tokenHash = createHash('sha256')
        .update(token)
        .digest('hex');

    // Session prüfen und die E-Mail des Benutzers laden
    const [users] = await db.execute(
        `SELECT users.email
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ?
         AND sessions.expires_at > UTC_TIMESTAMP()`,
        [tokenHash]
    );

    if (!users[0]) {
        cookies.delete('session', { path: '/' });
        redirect(303, '/login');
    }

    return { email: users[0].email };
}