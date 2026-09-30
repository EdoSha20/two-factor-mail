import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { randomInt, randomBytes, createHash } from 'node:crypto';
import { db } from '$lib/server/db.js';
import { sendLoginCode } from '$lib/server/mail.js';

function hash(value) {
    return createHash('sha256').update(value).digest('hex');
}

export const actions = {
    default: async ({ request, cookies, url }) => {
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

        // Benutzer suchen
        const [users] = await db.execute(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        const user = users[0];

        // Passwort prüfen
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return fail(400, {
                message: 'E-Mail oder Passwort ist falsch.'
            });
        }

        // Höchstens drei Codes in 15 Minuten anfordern
        const [requests] = await db.execute(
            `SELECT COUNT(*) AS total
             FROM login_codes
             WHERE user_id = ?
             AND created_at > UTC_TIMESTAMP() - INTERVAL 15 MINUTE`,
            [user.id]
        );

        if (requests[0].total >= 3) {
            return fail(429, {
                message: 'Zu viele Codes angefordert. Bitte später versuchen.'
            });
        }

        // Code und zufälliges Token für diesen Login erzeugen
        const code = String(randomInt(0, 1000000)).padStart(6, '0');
        const challenge = randomBytes(32).toString('hex');

        // Nur Hashes in der Datenbank speichern
        await db.execute(
            `INSERT INTO login_codes
             (user_id, challenge_hash, code_hash, expires_at, created_at)
             VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL 10 MINUTE,
                     UTC_TIMESTAMP())`,
            [
                user.id,
                hash(challenge),
                hash(`${challenge}:${code}`)
            ]
        );

        try {
            await sendLoginCode(user.email, code);
        } catch (error) {
            // SMTP-Fehler im Terminal anzeigen
            console.error(
                'SMTP-Fehler:',
                error.code,
                error.response
            );

            await db.execute(
                'DELETE FROM login_codes WHERE challenge_hash = ?',
                [hash(challenge)]
            );

            return fail(502, {
                message: 'E-Mail konnte nicht gesendet werden.'
            });
        }

        // Noch keine Session: zuerst muss der Code bestätigt werden
        cookies.set('challenge', challenge, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: url.protocol === 'https:',
            maxAge: 600
        });

        redirect(303, '/verify');
    }
};