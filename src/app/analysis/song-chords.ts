import { Chord } from './chord';
import { ChordType } from './chord-type.enum';
import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';
import { NotesTrack } from '../midi/notes-track';

export class SongChords {
    private _chords: Chord[];

    constructor(private _song: SongJson) {
    }

    get chords(): Chord[] {
        if (!this._chords) {
            this._chords = this.getChords();
        }
        return this._chords;
    }

    // Returns the chord that happens at beat n
    public getChordAtBeat(n: number): Chord {
        for (let i = 0; i < this.chords.length; i++) {
            let chord = this.chords[i];
            if (chord.startTime <= (n - 1) * this._song.ticksPerBeat &&
                chord.startTime + chord.duration >= n * this.chords.length) {
                return chord;
            }
        }
        return null;
    }

    // We process the song to extract the succession of chords
    private getChords(): Chord[] {
        let TotalNumberBeats = Math.ceil(this._song.durationInTicks / this._song.ticksPerBeat);
        // we create a first aproximation of 1 chord for each beat
        let firstTry: Chord[] = this.initializeArrayOfChords(TotalNumberBeats);
        for (let i = 0; i < this._song.notesTracks.length; i++) {
            try {
                let notesTrack: NotesTrack = this._song.notesTracks[i];
                for (let j = 0; j < notesTrack.notesSequence.length; j++) {
                    try {
                        let note: TrackNote = notesTrack.notesSequence[j];
                        let startBeat = Math.floor(note.ticksFromStart / this._song.ticksPerBeat);
                        let endBeat = Math.ceil((note.ticksFromStart + note.duration) / this._song.ticksPerBeat);
                        for (let k = startBeat; k < endBeat; k++) {
                            firstTry[k].add(note);
                        }
                    } catch (l) {
                        let fdsfa = 9;
                    }
                }
            } catch (l) {
                let fdsfa = 9;
            }
        }
        // We now remove notes that probably don't belong to the chords and are just passing notes,
        // or are notes from the previous or the next chord 
        // We assume that a note that is very short, or that last several beats, but really don't
        // belong to the chord in the last or the first beat, can be safely removed from the chord
        // in that beat
        for (let i = 0; i < firstTry.length; i++) {
            try {
                if (firstTry[i].notes.length === 0) { continue; }
                while (firstTry[i].chordType === ChordType.Unknown) {
                    try {
                        let indexOfNoteToRemove: number = this.getIndexOfShortestNoteInChord(firstTry[i]);
                        firstTry[i].removeAt(indexOfNoteToRemove);
                    } catch (l) {
                        let fdsfa = 9;
                    }
                }
            } catch (l) {
                let fdsfa = 9;
            }
        }

        // Now we merge consecutive chords if they have the same root and the same type
        let returnValue: Chord[] = [];
        let i = 0;
        while (i < firstTry.length) {
            try {
                let chord = new Chord(firstTry[i].notes, i * this._song.ticksPerBeat);
                let j = 1;
                while (i + j < firstTry.length &&
                    firstTry[i].getRoot() === firstTry[i + j].getRoot() &&
                    firstTry[i].chordType === firstTry[j].chordType) {
                    try {
                        for (let k = 0; i < firstTry[j].notes.length; k++) {
                            try {
                                chord.add(firstTry[j].notes[k]);
                            } catch (l) {
                                let fdsfa = 9;
                            }
                        }
                        j++;
                    } catch (l) {
                        let fdsfa = 9;
                    }
                }
                chord.duration = j * this._song.ticksPerBeat;
                returnValue.push(chord);
                i += j;
            } catch (l) {
                let fdsfa = 9;
            }
        }
        return returnValue;
    }

    private getIndexOfShortestNoteInChord(chord: Chord): number {
        let indexOfShortest = 0;
        for (let i = 0; i < chord.notes.length; i++) {
            if (chord.notes[i].duration < chord.notes[indexOfShortest].duration) {
                indexOfShortest = i;
            }
        }
        return indexOfShortest;
    }
    private initializeArrayOfChords(dimension: number): Chord[] {
        let returnArray: Chord[] = new Array(dimension);
        for (let i = 0; i < dimension; i++) {
            returnArray[i] = new Chord();
        }
        return returnArray;
    }
}