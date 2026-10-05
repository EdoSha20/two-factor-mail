import { fail, redirect } from '@sveltejs/kit';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from '$lib/server/db.js';

// Einen Wert als SHA-256-Hash zurückgeben
function hash(value) {
    return createHash('sha256').update(value).digest('hex');
}

export function load({ cookies }) {
    // Ohne Login-Versuch zurück zur Anmeldung
    if (!cookies.get('challenge')) {
        redirect(303, '/login');
    }
}

export const actions = {
    default: async ({ request, cookies, url }) => {
        // Challenge aus dem Cookie und Code aus dem Formular lesen
        const challenge = cookies.get('challenge');
        const data = await request.formData();
        const code = String(data.get('code') || '').trim();

        // Die Challenge muss das erwartete Format haben
        if (!challenge || !/^[a-f0-9]{64}$/.test(challenge)) {
            redirect(303, '/login');
        }

        // Genau sechs Ziffern erlauben
        if (!/^\d{6}$/.test(code)) {
            return fail(400, {
                message: 'Bitte sechs Ziffern eingeben.'
            });
        }

        const connection = await db.getConnection();

        try {
            // Datenbankänderungen gemeinsam ausführen
            await connection.beginTransaction();

            // Sperre verhindert gleichzeitige Verwendung desselben Codes
            const [rows] = await connection.execute(
                `SELECT id, user_id, code_hash, attempts,
                        expires_at > UTC_TIMESTAMP() AS valid
                 FROM login_codes
                 WHERE challenge_hash = ?
                 FOR UPDATE`,
                [hash(challenge)]
            );

            const entry = rows[0];

            // Fehlende, abgelaufene oder gesperrte Codes ablehnen
            if (!entry || !entry.valid || entry.attempts >= 5) {
                await connection.commit();
                cookies.delete('challenge', { path: '/' });

                return fail(400, {
                    message: 'Code abgelaufen oder gesperrt. Bitte neu anmelden.'
                });
            }

            // Hash aus Challenge und eingegebenem Code bilden
            const enteredHash = hash(`${challenge}:${code}`);

            // Beide Hashes ohne zeitabhängigen Vergleich prüfen
            const correct = timingSafeEqual(
                Buffer.from(entry.code_hash, 'hex'),
                Buffer.from(enteredHash, 'hex')
            );

            if (!correct) {
                // Falschen Versuch mitzählen
                await connection.execute(
                    'UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?',
                    [entry.id]
                );

                await connection.commit();

                return fail(400, {
                    message: 'Code falsch. Maximal fünf Versuche.'
                });
            }

            // Code verbrauchen; Eintrag bleibt für das Anforderungslimit erhalten
            await connection.execute(
                'UPDATE login_codes SET expires_at = UTC_TIMESTAMP() WHERE id = ?',
                [entry.id]
            );

            // Zufälligen Session-Token erzeugen
            const token = randomBytes(32).toString('hex');

            // Session für einen Tag speichern, nur mit Token-Hash
            await connection.execute(
                `INSERT INTO sessions (user_id, token_hash, expires_at)
                 VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 DAY)`,
                [entry.user_id, hash(token)]
            );

            await connection.commit();

            // Challenge entfernen und Session-Cookie setzen
            cookies.delete('challenge', { path: '/' });

            cookies.set('session', token, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: url.protocol === 'https:',
                maxAge: 86400
            });
        } catch (error) {
            // Bei einem Fehler die Datenbankänderungen zurücknehmen
            await connection.rollback();
            throw error;
        } finally {
            // Verbindung an den Pool zurückgeben
            connection.release();
        }

        // Nach erfolgreicher Prüfung zum Dashboard wechseln
        redirect(303, '/dashboard');
    }
};