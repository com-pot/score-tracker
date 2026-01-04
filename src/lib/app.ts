import { env } from "$env/dynamic/public";

export default {
    name: env.PUBLIC_APP_NAME || "Coontest",
    version: import.meta.env.APP_VERSION,
    links: {
        github: "https://github.com/com-pot/score-tracker",
    },
}
