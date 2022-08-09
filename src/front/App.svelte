<script lang="ts">
	import { Router, Link, Route } from 'svelte-routing';
	import AboutPanel from './panels/AboutPanel.svelte';
	import HomePanel from './panels/HomePanel.svelte';
	
	export let name: string;

	window.api.log(name);
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<Router url="">
		<nav>
			<Link to="/">Home</Link>
			<Link to="/about">About</Link>
		  </nav>
		  <div>
			<Route path="/" component="{HomePanel}" />
			<Route path="/about" component="{AboutPanel}" />
		  </div>
	</Router>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>