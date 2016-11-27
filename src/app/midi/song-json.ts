import { midiEvent } from './midi-event';

export class songJson {
    format: number;
    tracksCount: number;
    ticksPerBeat: number;
    tracks: midiEvent[][];
}