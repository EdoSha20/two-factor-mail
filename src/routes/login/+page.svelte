<script>
    // Rückmeldung der Server-Action erhalten
    let { form } = $props();
</script>

<h1>Anmelden</h1>
<p>Nach der Passwortprüfung bekommst du einen Code per E-Mail.</p>

<!-- Anmeldedaten an den Server senden -->
<form method="POST">
    <label for="email">E-Mail</label>
    <input
        id="email"
        name="email"
        type="email"
        autocomplete="username"
        required
    />

    <label for="password">Passwort</label>
    <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
    />

    <button type="submit">Code senden</button>
</form>

<!-- Meldung nach dem Absenden anzeigen -->
{#if form?.message}
    <p role="status">{form.message}</p>
{/if}

<style>
    /* Formularfelder untereinander anordnen */
    form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 350px;
    }

    /* Einheitliche Abstände und Schrift */
    input,
    button {
        padding: 10px;
        font: inherit;
    }
</style>