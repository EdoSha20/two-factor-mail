import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';

// Eingaben im Terminal ermöglichen
const input = createInterface({
    input: process.stdin,
    output: process.stdout
});

let connection;

try {
    // E-Mail einlesen und vereinheitlichen
    const email = (await input.question('E-Mail: '))
        .trim()
        .toLowerCase();

    // Passwort einlesen; die Eingabe ist sichtbar
    const password = await input.question(
        'Passwort (mindestens 12 Zeichen, Eingabe sichtbar): '
    );

    // Eingaben einfach prüfen
    if (!email.includes('@') || password.length < 12) {
        throw new Error('E-Mail oder Passwort ungültig.');
    }

    // Mit der Datenbank verbinden
    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Passwort mit bcrypt hashen
    const passwordHash = await bcrypt.hash(password, 12);

    // Benutzer mit Passwort-Hash speichern
    await connection.execute(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
    );

    console.log('Benutzer erfolgreich erstellt!');
} finally {
    // Terminaleingabe und Datenbankverbindung schließen
    input.close();

    if (connection) {
        await connection.end();
    }
}