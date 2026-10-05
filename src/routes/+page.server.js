// Startseite zum Dashboard weiterleiten

import { redirect } from '@sveltejs/kit';

export function load() {
    redirect(303, '/dashboard');
}