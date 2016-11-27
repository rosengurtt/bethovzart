import { trackNote } from './track-note';
import { trackRange } from './track-range';

export class notesTrack {
    notesSequence: trackNote[];
    range: trackRange;

    constructor(seq: trackNote[], range: trackRange) {
        this.notesSequence = seq;
        this.range = range;
    }
}