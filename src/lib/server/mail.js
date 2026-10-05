import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// Verbindung zu SMTP2GO mit verschlüsselter Übertragung
const transporter = nodemailer.createTransport({
    // SMTP-Einstellungen aus den privaten Umgebungsvariablen lesen
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),

    // Verbindung über STARTTLS verschlüsseln
    secure: false,
    requireTLS: true,

    // Mit den SMTP-Zugangsdaten anmelden
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