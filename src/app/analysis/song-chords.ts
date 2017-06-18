import { Chord } from './chord';
import { ChordType } from './chord-type.enum';
import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';
import { NotesTrack } from '../midi/notes-track';
import { AlterationType } from './alteration-type.enum';

export class SongChords {
    private _chords: Chord[];
    private _notesTracks: NotesTrack[];
    private _songDurationInTicks: number;
    private _songTicksPerBeat: number;

    constructor(song?: SongJson, songDurationInTicks?: number, songTicksPerBeat?: number,
        notesTracks?: NotesTrack[]) {
        if (song) {
            this._notesTracks = song.notesTracks;
            this._songDurationInTicks = song.durationInTicks;
            this._songTicksPerBeat = song.ticksPerBeat;
        } else {
            this._notesTracks = notesTracks;
            this._songDurationInTicks = songDurationInTicks;
            this._songTicksPerBeat = songTicksPerBeat;
        }
    }

    get chords(): Chord[] {
        if (!this._chords) {
            this._chords = this.getChords();
        }
        return this._chords;
    }

    // Returns the chord that happens at beat n
    public getChordAtBeat(n: number): Chord {
        // for (let i = 0; i < this.chords.length; i++) {
        //     let chord = this.chords[i];
        //     if (chord.startTime <= (n - 1) * this._songTicksPerBeat &&
        //         chord.startTime + chord.duration >= n * this.chords.length) {
        //         return chord;
        //     }
        // }
        // return null;
        return this.chords[n];
    }

    // We process the song to extract the succession of chords
    private getChords(): Chord[] {
        let TotalNumberBeats = Math.ceil(this._songDurationInTicks / this._songTicksPerBeat);
        // we create a first aproximation of 1 chord for each beat
        let firstTry: Chord[] = this.initializeArrayOfChords(TotalNumberBeats);
        for (let i = 0; i < this._notesTracks.length; i++) {
            try {
                let notesTrack: NotesTrack = this._notesTracks[i];
                for (let j = 0; j < notesTrack.notesSequence.length; j++) {
                    try {
                        let note: TrackNote = notesTrack.notesSequence[j];
                        let startBeat = Math.round(note.ticksFromStart / this._songTicksPerBeat) + 1;
                        // if duration is less than a beat, set endBeat to the next beat, otherwise we would ignore it
                        let noteDuration = note.duration;
                        if (noteDuration < this._songTicksPerBeat) { noteDuration = this._songTicksPerBeat; }
                        let endBeat = Math.round((note.ticksFromStart + noteDuration) / this._songTicksPerBeat) + 1;

                        for (let k = startBeat; k < endBeat; k++) {
                            firstTry[k].add(note);
                        }
                    } catch (l) {
                        let puton = 9;
                    }
                }
            } catch (l) {
                let puton = 9;
            }
        }
        // We now remove notes that probably don't belong to the chords and are just passing notes,
        // or are notes from the previous or the next chord 
        // We assume that a note that is very short, or that last several beats, but really don't
        // belong to the chord in the last or the first beat, can be safely removed from the chord
        // in that beat
        for (let n = 0; n < firstTry.length; n++) {
            try {
                if (firstTry[n].notes.length === 0) {
                    continue;
                }
                if (n === 33) {
                    let puton = 3
                    let sorete=firstTry[n].root
                }
                while (firstTry[n].chordType === ChordType.Unknown) {
                    try {
                        let indexOfNoteToRemove: number = this.getIndexOfShortestNoteInChord(firstTry[n]);
                        firstTry[n].removeAt(indexOfNoteToRemove);
                    } catch (l) {
                        let puton = 9;
                    }
                }
            } catch (l) {
                let puton = 9;
            }
        }
        return firstTry;

        // Now we merge consecutive chords if they have the same root and the same type
        // let returnValue: Chord[] = [];
        // let i = 0;
        // while (i < firstTry.length) {
        //     try {
        //         if (firstTry[i].chordType === ChordType.Unknown || firstTry[i].chordType === ChordType.NotAchord) {
        //             i++;
        //             continue;
        //         }
        //         let chord = new Chord(firstTry[i].notes, i * this._songTicksPerBeat);
        //         let j = 1;
        //         while (i + j < firstTry.length &&
        //             firstTry[i].root === firstTry[i + j].root &&
        //             firstTry[i].chordType === firstTry[j].chordType) {
        //             try {
        //                 for (let k = 0; i < firstTry[j].notes.length; k++) {
        //                     try {
        //                         chord.add(firstTry[j].notes[k]);
        //                     } catch (l) {
        //                         let puton = 9;
        //                     }
        //                 }
        //                 j++;
        //             } catch (l) {
        //                 let puton = 9;
        //             }
        //         }
        //         chord.duration = j * this._songTicksPerBeat;
        //         returnValue.push(chord);
        //         i += j;
        //     } catch (l) {
        //         let puton = 9;
        //     }
        // }
        // return returnValue;
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