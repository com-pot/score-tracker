import { createGameStorage } from "./score/trackingStore";

export const defaultGameStorage = createGameStorage("localstorage", {prefix: "cp/st:game."})