import type { Constructor } from "../types.ts";

export function ContainerControlsMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {

    }
}