export class ConcatenateUint8Array {
    static concat(a: Uint8Array, b: Uint8Array): Uint8Array {
        let c = new Uint8Array(a.length + b.length);
        c.set(a);
        c.set(b, a.length);
        return c;
    }
}