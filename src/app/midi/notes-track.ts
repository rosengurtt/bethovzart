import { TrackNote } from './track-note';
import { TrackRange } from './track-range';
import { Instrument } from './midi-codes/instrument.enum'

export class NotesTrack {
    notesSequence: TrackNote[];
    range: TrackRange;
    instrument: Instrument;
    channel: number;
    trackName: string;
    trackNumber: number; // The sequence number in the sequence of all tracks

    constructor(seq: TrackNote[], range: TrackRange, instrument: Instrument, channel: number, trackNumber: number) {
        this.notesSequence = seq;
        this.range = range;
        this.instrument = instrument;
        this.trackNumber = trackNumber;
        this.channel = channel;
    }
}