import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

// Verbindungen zur MySQL-Datenbank gemeinsam verwenden
export const db = mysql.createPool({
    // Zugangsdaten aus den privaten Umgebungsvariablen lesen
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,

    // Höchstens fünf Verbindungen gleichzeitig verwenden
    connectionLimit: 5,

    // Datumswerte beim Lesen und Schreiben als UTC behandeln
    timezone: 'Z'
});