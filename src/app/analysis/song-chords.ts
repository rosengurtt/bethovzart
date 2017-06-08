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

    // We process the song to extract the succession of chords
    private getChords(): Chords[] {
        let TotalNumberBeats = Math.ceil(this._song.durationInTicks / this._song.ticksPerBeat);
        // we create a first aproximation of 1 chord for each beat
        let firstTry: Chord[] = new Array(TotalNumberBeats);
        for (let i = 0; i < this._song.notesTracks.length; i++) {
            let notesTrack: NotesTrack = this._song.notesTracks[i];
            for (let j = 0; j < notesTrack.notesSequence.length; j++) {
                let note: TrackNote = notesTrack.notesSequence[j];
                let startBeat = Math.floor(note.ticksFromStart / this._song.ticksPerBeat);
                let endBeat = Math.ceil((note.ticksFromStart + note.duration) / this._song.ticksPerBeat);
                let notesInChord: TrackNote[] = [];
                for (let k = startBeat; k < endBeat; k++) {
                    firstTry[k].add(note);
                }
            }
        }
        // We now remove notes that probably don't belong to the chords and are just passing notes,
        // or are notes from the previous or the next chord 
        // We assume that a note that is very short, or that last several beats, but really don't
        // belong to the chord in the last or the first beat, can be safely removed from the chord
        // in that beat
        for (let i = 0; i <= TotalNumberBeats; i++) {
            if (firstTry[i].notes.length === 0) { continue; }
            while (firstTry[i].getType() === ChordType.Unknown) {
                let indexOfNoteToRemove: number = this.getIndexOfShortestNoteInChord(firstTry[i]);
                firstTry[i].removeAt(indexOfNoteToRemove);
            }

        }

        // Now we merge consecutive chords if they have the same root and the same type
        // We finally save the end result in the _chords array
        let i = 0;
        while (i < TotalNumberBeats) {
            let chord = new Chord(firstTry[i].notes);
            let j = 1;
            while (firstTry[i].getRoot() === firstTry[i + j].getRoot() &&
                firstTry[i].getType() === firstTry[j].getType()) {
                for (let k = 0; i < firstTry[j].notes.length; k++) {
                    chord.add(firstTry[j].notes[k]);
                }
                this._chords.push(chord);
                j++;
            }
            i += j;
        }
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
}