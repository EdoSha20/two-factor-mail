<script>

	import './layout.css';

	import favicon from '$lib/assets/favicon.svg';
 
	let { children } = $props();
</script>
 
<svelte:head>
<title>Two Factor Mail</title>
<link rel="icon" href={favicon} />
</svelte:head>
 
<main>
<div class="site-name">TWO FACTOR MAIL</div>
 
	{@render children()}
</main>
 