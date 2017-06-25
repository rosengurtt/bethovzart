import { ScaleMode } from './scale-mode.enum';
export class Tonic {
    public pitch: number;
    public mode: ScaleMode;

    public getRepresentation() {
        let returnValue: string;
        switch (this.pitch) {
            case 0:
                returnValue = 'C';
                break;
            case 1:
                if (this.mode === ScaleMode.Major) {
                    returnValue = 'Db';
                } else {
                    returnValue = 'C#';
                }
                break;
            case 2:
                returnValue = 'D';
                break;
            case 3:
                returnValue = 'Eb';
                break;
            case 4:
                returnValue = 'E';
                break;
            case 5:
                returnValue = 'F';
                break;
            case 6:
                returnValue = 'F#';
                break;
            case 7:
                returnValue = 'G';
                break;
            case 8:
                if (this.mode === ScaleMode.Major) {
                    returnValue = 'Ab';
                } else {
                    returnValue = 'G#';
                }
                break;
            case 9:
                returnValue = 'A';
                break;
            case 10:
                returnValue = 'Bb';
                break;
            case 11:
                returnValue = 'B';
                break;
        }
        if (this.mode === ScaleMode.Minor) {
            returnValue += ' min';
        }
        return returnValue;
    }
}