import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db.js';

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();

        const email = String(data.get('email') || '')
            .trim()
            .toLowerCase();
        const password = String(data.get('password') || '');

        if (!email || !password) {
            return fail(400, {
                message: 'Bitte E-Mail und Passwort eingeben.'
            });
        }

        // Benutzer anhand seiner E-Mail suchen
        const [users] = await db.execute(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        const user = users[0];

        if (!user) {
            return fail(400, {
                message: 'E-Mail oder Passwort ist falsch.'
            });
        }

        // Eingabe mit dem gespeicherten Passwort-Hash vergleichen
        const correct = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!correct) {
            return fail(400, {
                message: 'E-Mail oder Passwort ist falsch.'
            });
        }

        return {
            message: 'Passwort richtig. Die Code-Prüfung ergänzen wir als Nächstes.'
        };
    }
};