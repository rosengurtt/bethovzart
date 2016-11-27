import { Band } from "./band";

export class Song {
    _id: string;
    name: string;
    band: Band;
    midiFile: ArrayBuffer;
    jsonFile:any;
} 