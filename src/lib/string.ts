/**
 * Creates a URL-friendly slug from a given string
 */
export const createSlug = (str: string): string => {
    return str
        .toLowerCase()
        .normalize("NFD") // Normalize to decompose combined characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/ß/g, "ss") // Special case for German sharp S
        .replace(/æ/g, "ae") // Special case for AE ligature
        .replace(/ø/g, "o") // Special case for Danish/Norwegian O slash
        .replace(/đ/g, "d") // Special case for Vietnamese D with stroke
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, "") // Trim leading and trailing hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen
}
