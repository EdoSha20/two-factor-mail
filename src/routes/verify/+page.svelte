<script>

    let { form } = $props();
</script>
 
<h1>Code bestätigen</h1>
<p>Gib den sechsstelligen Code aus deiner E-Mail ein.</p>
 
<form method="POST">
<label for="code">Login-Code</label>
<input

        id="code"

        name="code"

        type="text"

        inputmode="numeric"

        pattern="[0-9]{6}"

        maxlength="6"

        autocomplete="one-time-code"

        required

    />
 
    <button type="submit">Code prüfen</button>
</form>
 
{#if form?.message}
<p role="status">{form.message}</p>

{/if}
 