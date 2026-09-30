import { fail, redirect } from '@sveltejs/kit';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { db } from '$lib/server/db.js';
 
function hash(value) {

    return createHash('sha256').update(value).digest('hex');

}
 
export function load({ cookies }) {

    if (!cookies.get('challenge')) {

        redirect(303, '/login');

    }

}
 
export const actions = {

    default: async ({ request, cookies, url }) => {

        const challenge = cookies.get('challenge');

        const data = await request.formData();

        const code = String(data.get('code') || '').trim();
 
        if (!challenge || !/^[a-f0-9]{64}$/.test(challenge)) {

            redirect(303, '/login');

        }
 
        if (!/^\d{6}$/.test(code)) {

            return fail(400, {

                message: 'Bitte sechs Ziffern eingeben.'

            });

        }
 
        const connection = await db.getConnection();
 
        try {

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
 
            if (!entry || !entry.valid || entry.attempts >= 5) {

                await connection.commit();

                cookies.delete('challenge', { path: '/' });
 
                return fail(400, {

                    message: 'Code abgelaufen oder gesperrt. Bitte neu anmelden.'

                });

            }
 
            const enteredHash = hash(`${challenge}:${code}`);
 
            const correct = timingSafeEqual(

                Buffer.from(entry.code_hash, 'hex'),

                Buffer.from(enteredHash, 'hex')

            );
 
            if (!correct) {

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
 
            const token = randomBytes(32).toString('hex');
 
            await connection.execute(

                `INSERT INTO sessions (user_id, token_hash, expires_at)

                 VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL 1 DAY)`,

                [entry.user_id, hash(token)]

            );
 
            await connection.commit();
 
            cookies.delete('challenge', { path: '/' });
 
            cookies.set('session', token, {

                path: '/',

                httpOnly: true,

                sameSite: 'lax',

                secure: url.protocol === 'https:',

                maxAge: 86400

            });

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
 
        redirect(303, '/dashboard');

    }

};
 