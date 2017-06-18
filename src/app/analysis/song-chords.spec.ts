import { Chord } from './chord';
import { TrackNote } from '../midi/track-note';
import { ChordType } from './chord-type.enum';
import { AlterationType } from './alteration-type.enum';
import { SongChords } from './song-chords';
import { NotesTrack } from '../midi/notes-track';
import * as data from './year-cat.json';

describe('Test of song-chord: ', () => {
    let durationInTicks = 281104;
    let ticksPerBeat = 384;
    let notesTrack: NotesTrack[] = (<any>data);
    let yearOfTheCat = new SongChords(null, durationInTicks, ticksPerBeat, notesTrack)
    let chord1 = yearOfTheCat.getChordAtBeat(9);
    let chord2=yearOfTheCat.getChordAtBeat(33);
    let chord3=yearOfTheCat.getChordAtBeat(404);
    beforeEach(() => {

    });
    it('First chord of song at beat 8 is Cmaj7', () => {
        expect(chord1.chordType).toBe(ChordType.Major7);
        expect(chord1.root % 12).toBe(0);
    });
    it('First chord of song at bar 9 is Am9', () => {
        expect(chord2.chordType).toBe(ChordType.Minor9);
        expect(chord2.root % 12).toBe(9);
    });
    it('First chord of song at bar 404 is Am9', () => {
        expect(chord2.chordType).toBe(ChordType.Minor9);
        expect(chord2.root % 12).toBe(9);
    });
});
