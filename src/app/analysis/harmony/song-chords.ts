// Represent the chords playing in each beat of a song
// There is one chord object per beat in the song

import { Chord } from './chord';
import { SongJson } from '../../midi/song-json/song-json';
import { TrackNote } from '../../midi/track-note';
import { NotesTrack } from '../../midi/notes-track';
import { Tonic } from './tonic';
import { SongTonality } from './song-tonality';
import { ScaleMode } from './scale-mode.enum';

export class SongChords {
    private _chords: Chord[];
    private _notesTracks: NotesTrack[];
    private _songDurationInTicks: number;
    private _songTicksPerBeat: number;
    private _tonics: Tonic[];

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
        return this.chords[n];
    }
    // I call roman number the position of the root of the chord in the scale
    // This is traditionally written in roman numbers
    public getRomanNumberAtBeat(beat: number): number {
        if (!this._tonics) {
            let tonality = new SongTonality(null, this._songDurationInTicks, this._songTicksPerBeat, this._notesTracks);
            this._tonics = tonality.tonics;
        }
        let semitonesFromScaleTonic = (this._chords[beat].root - this._tonics[beat].pitch) % 12;
        switch (semitonesFromScaleTonic) {
            case 0:
                return 1;
            case 2:
                return 2;
            case 3:
                if (this._tonics[beat].mode === ScaleMode.Minor) {
                    return 3;
                }
            case 4:
                if (this._tonics[beat].mode === ScaleMode.Major) {
                    return 3;
                }
            case 5:
                return 4;
            case 7:
                return 5;
            case 8:
                if (this._tonics[beat].mode === ScaleMode.Minor) {
                    return 6;
                }
            case 9:
                return 6;
            case 10:
                if (this._tonics[beat].mode === ScaleMode.Minor) {
                    return 7;
                }
            case 11:
                return 7;
            default:
                return null;
        }
    }


    // We process the song to extract the succession of chords
    private getChords(): Chord[] {
        let TotalNumberBeats = Math.ceil(this._songDurationInTicks / this._songTicksPerBeat);
        // we create a first aproximation of 1 chord for each beat
        let firstTry: Chord[] = this.initializeArrayOfChords(TotalNumberBeats);
        for (let i = 0; i < this._notesTracks.length; i++) {
            // The drums channel data is not included in the chords
            if (this._notesTracks[i].channel === 9) {
                continue;
            }
            let notesTrack: NotesTrack = this._notesTracks[i];
            for (let j = 0; j < notesTrack.notesSequence.length; j++) {
                let note: TrackNote = notesTrack.notesSequence[j];
                let startBeat = Math.round(note.ticksFromStart / this._songTicksPerBeat) + 1;
                // if duration is less than a beat, set endBeat to the next beat, otherwise we would ignore it
                let noteDuration = note.duration;
                if (noteDuration < this._songTicksPerBeat) { noteDuration = this._songTicksPerBeat; }
                let endBeat = Math.round((note.ticksFromStart + noteDuration) / this._songTicksPerBeat) + 1;
                try {
                    for (let k = startBeat; k < endBeat; k++) {
                        firstTry[k].add(note);
                    }
                } catch (dd) {
                    let lolo = 9
                }
            }
        }
        return firstTry;
    }

    private initializeArrayOfChords(dimension: number): Chord[] {
        let returnArray: Chord[] = new Array(dimension);
        for (let i = 0; i < dimension + 1; i++) {
            returnArray[i] = new Chord();
        }
        return returnArray;
    }
}
