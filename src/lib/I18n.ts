import { createContext } from "svelte";

export type Localized<T> = {
    [locale: string]: T;
}

export type I18nString = string | Localized<string>;
export function t(i18n: I18nString, locale: string): string {
    if (typeof i18n === "string") {
        return i18n;
    } else {
        return i18n[locale] || Object.values(i18n)[0] || "";
    }
}

export type I18nCore = {
    locale: string;
}
export type I18nTranslator = {
    readonly core: I18nCore;
    t: (i18n: I18nString) => string;
}

export function createI18nTranslator(core: I18nCore): I18nTranslator {
    return {
        core,
        t: (i18n: I18nString) => t(i18n, core.locale),
    }
}


export const [getI18n, setI18n] = createContext<I18nTranslator>()
