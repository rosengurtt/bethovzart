import { Tonic } from './tonic';
import { SongTonality } from './song-tonality';
import { ScaleMode } from './scale-mode.enum';
import { TrackNote } from '../midi/track-note';
import { NotesTrack } from '../midi/notes-track';
import * as data1 from './test-data/c-scale-song.json';
import * as data2 from './test-data/f-minor-song.json';

describe('Test of song-chord: ', () => {
    let durationInTicks = 5376;
    let ticksPerBeat = 384;
    let notesTrack1: NotesTrack[] = (<any>data1);
    let cScaleSong = new SongTonality(null, durationInTicks, ticksPerBeat, notesTrack1);
    let tonic1 = cScaleSong.tonic[9];

    let notesTrack2: NotesTrack[] = (<any>data2);
    let fMinorSong = new SongTonality(null, durationInTicks, ticksPerBeat, notesTrack2);
    let tonic2 = fMinorSong.tonic[9];
    beforeEach(() => {

    });
    it('An ascending C scale sequence has a tonality of C major', () => {
        expect(tonic1.pitch).toBe(0);
        expect(tonic1.mode).toBe(ScaleMode.Major);
    });
    it('An ascending F minor scale sequence has a tonality of F minor', () => {
        expect(tonic2.pitch).toBe(5);
        expect(tonic2.mode).toBe(ScaleMode.Minor);
    });
});
