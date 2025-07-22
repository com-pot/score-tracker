<script>
    import Header from './Header.svelte';
    import { onMount } from 'svelte';
    import '../styles/score-tracker.scss';
    import app from '$lib/app';

    let { children } = $props();

    onMount(async () => {
        await import ("bootstrap/dist/js/bootstrap.js");
    })
</script>

<div class="app">
    <Header />

    <main>
        {@render children()}
    </main>

    <footer>
        <a href={app.links.github} target="_blank">
            com-pot/score-tracker v{app.version}
        </a>
    </footer>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        max-width: 64rem;
        margin: 0 auto;
        box-sizing: border-box;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
    }

    footer a {
        font-weight: bold;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }
</style>
