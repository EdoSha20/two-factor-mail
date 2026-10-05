<script>
    // Benutzerdaten vom Server erhalten
    let { data } = $props();
</script>

<h1>Erfolgreich angemeldet!</h1>

<!-- E-Mail des angemeldeten Benutzers anzeigen -->
<p>Willkommen, <strong>{data.email}</strong>.</p>

<p>Dein Passwort und dein E-Mail-Code wurden bestätigt.</p>

<!-- Abmeldung per POST an den Server senden -->
<form method="POST" action="/logout">
<button type="submit">Abmelden</button>
</form>