import { TrackNote } from './track-note';
import { TrackRange } from './track-range';
import { instrument } from './midi-codes/instrument.enum'

export class NotesTrack {
    notesSequence: TrackNote[];
    range: TrackRange;
    instrument: instrument;
    trackName: string;

    constructor(seq: TrackNote[], range: TrackRange, instrument: instrument, trackName: string) {
        this.notesSequence = seq;
        this.range = range;
        this.instrument = instrument;
        this.trackName = trackName;
    }
}