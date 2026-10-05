<script>
    // Rückmeldung der Server-Action erhalten
    let { form } = $props();
</script>

<h1>Code bestätigen</h1>
<p>Gib den sechsstelligen Code aus deiner E-Mail ein.</p>

<!-- E-Mail-Code zur Prüfung an den Server senden -->
<form method="POST">
    <label for="code">Login-Code</label>

    <!-- Textfeld erhält auch führende Nullen -->
    <input
        id="code"
        name="code"
        type="text"
        inputmode="numeric"
        minlength="6"
        maxlength="6"
        autocomplete="one-time-code"
        required
    />

    <button type="submit">Code prüfen</button>
</form>

<!-- Rückmeldung zur Code-Prüfung anzeigen -->
{#if form?.message}
    <p role="status">{form.message}</p>
{/if}