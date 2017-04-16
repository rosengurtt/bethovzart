import { TrackNote } from './track-note';
import { TrackRange } from './track-range';
import { Instrument } from './midi-codes/instrument.enum'

export class NotesTrack {
    notesSequence: TrackNote[];
    range: TrackRange;
    instrument: Instrument;
    trackName: string;

    constructor(seq: TrackNote[], range: TrackRange, instrument: Instrument, trackName: string) {
        this.notesSequence = seq;
        this.range = range;
        this.instrument = instrument;
        this.trackName = trackName;
    }
}