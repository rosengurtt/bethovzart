export class midiEvent {
    delta: number;
    ticksSinceStart?: number;
    index: number;
    length: number;
    param1: number;
    param2: number;
    param3: number;
    param4: number;
    subtype: number;
    type: number;
    data: number[];
    tempo?: number;
    tempoBPM?: number;
}