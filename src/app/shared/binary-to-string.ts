export class Binary2String {
    static convert(array): string {
        let result = '';
        for (let i = 0; i < array.length; ++i) {
            result += (String.fromCharCode(array[i]));
        }
        return result;
    }
}