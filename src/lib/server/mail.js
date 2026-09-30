import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
console.log('SMTP-Einstellungen:', {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    passwordLength: env.SMTP_PASSWORD?.length
});
// Verbindung zu SMTP2GO mit verschlüsselter Übertragung
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: false,
    requireTLS: true,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
    }
});

// Login-Code an die E-Mail-Adresse des Benutzers senden
export async function sendLoginCode(email, code) {
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject: 'Dein Login-Code',
        text: `Dein Login-Code lautet: ${code}

Er ist 10 Minuten gültig.
Wenn du dich nicht angemeldet hast, ignoriere diese E-Mail.`
    });
}