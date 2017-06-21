// Finds what is the tonic in each bit of the song

import { Chord } from './chord';
import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';
import { NotesTrack } from '../midi/notes-track';
import { Tonic } from './tonic';
import { ScaleMode } from './scale-mode.enum';

export class SongTonality {
    private _tonic: Tonic[];
    private _notesTracks: NotesTrack[];
    private _songDurationInTicks: number;
    private _songTicksPerBeat: number;
    private _numberOfBeats: number;
    private _probabilities: number[][];

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
        this._numberOfBeats = this._songDurationInTicks / this._songTicksPerBeat;
    }

    get tonic() {
        if (!this._tonic) {
            this.analizeSong();
        }
        return this._tonic;
    }

    private analizeSong() {
        this._probabilities = this.initializeProbabilitiesArray();
        let firstTry: number[] = [];
        for (let i = 0; i < this._notesTracks.length; i++) {
            // The drums channel data is not included in the chords
            if (this._notesTracks[i].channel === 9) {
                continue;
            }
            let notesTrack: NotesTrack = this._notesTracks[i];
            for (let j = 0; j < notesTrack.notesSequence.length; j++) {
                this.calculateProbabilitiesContributionOfNote(notesTrack.notesSequence[j]);
            }
        }
        for (let beat = 1; beat <= this._numberOfBeats; beat++) {
            this.tonic[beat] = this.getTonicAtBeat(beat);
        }
        return firstTry;
    }

    // This array has 24 rows, rows 0 to 11 correspond to tonalities C maj to B maj
    // 12 to 23 correspond to Cmin to B min
    // The second index corresponds to the beat in the song. So for ex.
    // p[4][7] is the probability that E maj is the tonic in beat 7
    private initializeProbabilitiesArray(): number[][] {
        let returnArray: number[][] = [];
        for (let i = 0; i < 24; i++) {
            returnArray[i] = [];
            for (let beat = 1; beat <= this._numberOfBeats; beat++) {
                returnArray[i][beat] = 0;
            }
        }
        return returnArray;
    }

    // Increments the probabilities of the different possible tonics for beats that are up to 4 
    // beats away of the note
    // For example if a note of C is played on beat 8 until beat 10, it increments the probability 
    // that C, G, F, Bb, Eb, Am, Dm, Cm (scales that have a C note) are the tonic in beat 4 to 14
    // The contribution also depends on the volume and length of the note (so a passing note, that
    // may be actually out of the scale, will make a small contribution)
    private calculateProbabilitiesContributionOfNote(note: TrackNote, beatsWindow = 4) {
        let possibleTonics = this.getPossibleTonicsForNote(note.pitch);
        for (let i = 0; i < possibleTonics.length; i++) {
            let noteStartBeat = Math.round(note.ticksFromStart / this._songTicksPerBeat) + 1;
            let noteEndBeat = Math.round((note.ticksFromStart + note.duration) / this._songTicksPerBeat) + 1;
            for (let j = noteStartBeat - 4; j < noteEndBeat + 4; j++) {
                if (j < 1 || j > this._numberOfBeats) { continue; }
                this._probabilities[i][j] += (note.duration * note.volume) / 100;
            }
        }
    }
    // Given a pitch (for ex. C) return the indexes of the arrays that may be tonic, because their
    // scales include that pitch (in the example some possible tonics are F, G, Dm, that have indexes
    // of 5, 7 and 14 respectively)
    private getPossibleTonicsForNote(pitch: number): number[] {
        let returnArray = [];
        // Major scales
        returnArray.push((pitch + 7) % 12);
        returnArray.push(pitch % 12);
        returnArray.push((pitch + 5) % 12);
        returnArray.push((pitch + 10) % 12);
        returnArray.push((pitch + 15) % 12);
        returnArray.push((pitch + 20) % 12);
        // Minor scales
        returnArray.push((pitch + 4) % 12 + 12);
        returnArray.push((pitch + 9) % 12 + 12);
        returnArray.push((pitch + 2) % 12 + 12);
        returnArray.push((pitch + 7) % 12 + 12);
        returnArray.push((pitch % 12) + 12);
        returnArray.push((pitch + 5) % 12 + 12);

        return returnArray;
    }

    private getTonicAtBeat(beat: number): Tonic {
        let maxProb = 0;
        let tonic: Tonic = null;
        for (let i = 0; i < 24; i++) {
            if (this._probabilities[i][beat] > maxProb) {
                maxProb = this._probabilities[i][beat];
                tonic.pitch = i % 12;
                if (i < 12) {
                    tonic.mode = ScaleMode.Major;
                } else {
                    tonic.mode = ScaleMode.Minor;
                }
            }
        }
        return tonic;
    }
}