export type JsonSchema = {
    type: "string" | "number" | "boolean" | "object" | "array";
} & Record<string, any>;
