import { Chord } from './chord';
import { TrackNote } from '../midi/track-note';

describe('Test of chord: ', () => {
    let notes: TrackNote[] = [];
    notes.push(new TrackNote(0, 66, 15, false));
    notes.push(new TrackNote(5, 21, 18, false));
    notes.push(new TrackNote(0, 37, 20, false));
    notes.push(new TrackNote(3, 11, 18, false));
    let myChord: Chord = new Chord(notes);
    beforeEach(() => {

    });
    it('Notes are saved in pitch order', () => {
        expect(myChord.pitches[0] < myChord.pitches[1]).toBe(true);
        expect(myChord.pitches[1] < myChord.pitches[2]).toBe(true);
        expect(myChord.pitches[2] < myChord.pitches[3]).toBe(true);
    });
    it('Root is calculated correctly', () => {
        // Simple major triad no inversions
        notes = [];
        notes.push(new TrackNote(0, 0, 15, false));
        notes.push(new TrackNote(0, 4, 18, false));
        notes.push(new TrackNote(0, 7, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(0);
        // Simple major triad first inversions
        notes = [];
        notes.push(new TrackNote(0, 12, 15, false));
        notes.push(new TrackNote(0, 4, 18, false));
        notes.push(new TrackNote(0, 7, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(12);
        // Simple major triad second inversions
        notes = [];
        notes.push(new TrackNote(0, 12, 15, false));
        notes.push(new TrackNote(0, 16, 18, false));
        notes.push(new TrackNote(0, 7, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(12);
        // Simple minor triad with root in duplicated no inversions
        notes = [];
        notes.push(new TrackNote(0, 10, 15, false));
        notes.push(new TrackNote(0, 13, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 22, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(10);
        // Minor chord with major 7 no inversions
        notes = [];
        notes.push(new TrackNote(0, 10, 15, false));
        notes.push(new TrackNote(0, 13, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 21, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(10);
        // Major 7th chord first inversion
        notes = [];
        notes.push(new TrackNote(0, 22, 15, false));
        notes.push(new TrackNote(0, 14, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 21, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(22);
        // Dominant 7th chord second inversion
        notes = [];
        notes.push(new TrackNote(0, 22, 15, false));
        notes.push(new TrackNote(0, 26, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 20, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(22);
        // Sus chord no inversions
        notes = [];
        notes.push(new TrackNote(0, 10, 15, false));
        notes.push(new TrackNote(0, 15, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(10);
        // Sus chord first inversion
        notes = [];
        notes.push(new TrackNote(0, 22, 15, false));
        notes.push(new TrackNote(0, 15, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(22);
        // 9th chord second inversion
        notes = [];
        notes.push(new TrackNote(0, 22, 15, false));
        notes.push(new TrackNote(0, 26, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 21, 20, false));
        notes.push(new TrackNote(0, 24, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(22);
        // 9th chord second inversion without 7th
        notes = [];
        notes.push(new TrackNote(0, 22, 15, false));
        notes.push(new TrackNote(0, 26, 18, false));
        notes.push(new TrackNote(0, 17, 20, false));
        notes.push(new TrackNote(0, 24, 20, false));
        myChord = new Chord(notes);
        expect(myChord.getRoot()).toBe(22);
    });
    it('For major chords isMajor returns true and isMinor false', () => {
        notes = [];
        notes.push(new TrackNote(0, 24, 15, false));
        notes.push(new TrackNote(0, 4, 18, false));
        notes.push(new TrackNote(0, 19, 20, false));
        myChord = new Chord(notes);
        expect(myChord.isMajor()).toBe(true);
        expect(myChord.isMinor()).toBe(false);
    });
    it('For minor chords isMajor returns true and isMinor false', () => {
        notes = [];
        notes.push(new TrackNote(0, 24, 15, false));
        notes.push(new TrackNote(0, 3, 18, false));
        notes.push(new TrackNote(0, 19, 20, false));
        myChord = new Chord(notes);
        expect(myChord.isMajor()).toBe(false);
        expect(myChord.isMinor()).toBe(true);
    });
});
