import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';

const input = createInterface({
    input: process.stdin,
    output: process.stdout
});

let connection;

try {
    const email = (await input.question('E-Mail: '))
        .trim()
        .toLowerCase();

    const password = await input.question(
        'Passwort (mindestens 12 Zeichen, Eingabe sichtbar): '
    );

    if (!email.includes('@') || password.length < 12) {
        throw new Error('E-Mail oder Passwort ungültig.');
    }

    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
    );

    console.log('Benutzer erfolgreich erstellt!');
} finally {
    input.close();

    if (connection) {
        await connection.end();
    }
}