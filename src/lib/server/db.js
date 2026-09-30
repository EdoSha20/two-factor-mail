import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';
// Verbindungen zur MySQL-Datenbank gemeinsam verwenden
export const db = mysql.createPool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 5,
    timezone: 'Z'
});
 