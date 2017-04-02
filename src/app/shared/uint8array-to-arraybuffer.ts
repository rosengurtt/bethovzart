// The bloody javascript infrastructure is terrible to handle binary data
// This kind of ugly code is needed because of the convoluted way
// that binary data is handled in the browser

export class Uint8Array2ArrayBuffer {
/*    
This version works. But the other below is nicer and it seems that it works OK

    static convert(input: Uint8Array): ArrayBuffer {
        let buffer = new ArrayBuffer(input.length);
        let javascriptIhateYou = new DataView(buffer)
        input.map(function (value, i) {
            javascriptIhateYou.setUint8(i, value);
            return 1;
        });
        return buffer;
    }*/

    static convert(buffer: Uint8Array): ArrayBuffer {
        let ab = new ArrayBuffer(buffer.length);
        let view = new Uint8Array(ab);
        for (let i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
    };
}