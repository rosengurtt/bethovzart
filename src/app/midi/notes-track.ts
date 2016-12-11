import { trackNote } from './track-note';
import { trackRange } from './track-range';
import { instrument } from './midi-codes/instrument.enum'

export class notesTrack {
    notesSequence: trackNote[];
    range: trackRange;
    instrument: instrument;
    trackName: string;

    constructor(seq: trackNote[], range: trackRange, instrument: instrument, trackName: string) {
        this.notesSequence = seq;
        this.range = range;
        this.instrument = instrument;
        this.trackName = trackName;
    }
}