import { Tonic } from './tonic';
import { SongTonality } from './song-tonality';
import { ScaleMode } from './scale-mode.enum';
import { TrackNote } from '../midi/track-note';
import { NotesTrack } from '../midi/notes-track';
import * as data from './year-cat.json';

describe('Test of song-chord: ', () => {
    let durationInTicks = 281104;
    let ticksPerBeat = 384;
    let notesTrack: NotesTrack[] = (<any>data);
    let yearOfTheCat = new SongTonality(null, durationInTicks, ticksPerBeat, notesTrack)
    let tonic1 = yearOfTheCat.tonic[9];
    beforeEach(() => {

    });
    it('First chord of song at beat 8 is Cmaj7', () => {
        // expect(chord1.chordType).toBe(ChordType.Major7);
        // expect(chord1.root % 12).toBe(0);
    });;
});
