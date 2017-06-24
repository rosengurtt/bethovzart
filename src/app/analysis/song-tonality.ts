// Finds what is the tonic in each bit of the song

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
    // This array has 24 rows, rows 0 to 11 correspond to tonalities C maj to B maj
    // 12 to 23 correspond to Cmin to B min
    // The second index corresponds to the beat in the song. So for ex.
    // p[4][7] is the probability that E maj is the tonic in beat 7
    private _probabilities: number[][];
    // used to distinguish between a major scale and the corresponding minor
    // we save for each pitch, the sum of duration x volume in each beat
    private _notePower: number[][];

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
        this._numberOfBeats = Math.round(this._songDurationInTicks / this._songTicksPerBeat);
    }

    get tonic() {
        if (!this._tonic) {
            this.analizeSong();
        }
        return this._tonic;
    }

    private analizeSong() {
        this._tonic = [];
        this._probabilities = this.initializeProbabilitiesArray(24);
        this._notePower = this.initializeProbabilitiesArray(12);
        for (let i = 0; i < this._notesTracks.length; i++) {
            // The drums channel data is not included in the chords
            if (this._notesTracks[i].channel === 9) {
                continue;
            }
            let notesOfTrack: TrackNote[] = this._notesTracks[i].notesSequence;
            for (let j = 0; j < notesOfTrack.length; j++) {
                let note = notesOfTrack[j];
                this.calculateProbabilitiesContributionOfNote(note);
            }
        }

        for (let beat = 1; beat <= this._numberOfBeats; beat++) {
            this._tonic[beat] = this.getTonicAtBeatFirstTry(beat);
        }
        this.correctMinorMajorProblem();
    }

    private initializeProbabilitiesArray(n: number): number[][] {
        let returnArray: number[][] = [];
        for (let i = 0; i < n; i++) {
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
        let noteStartBeat = Math.round(note.ticksFromStart / this._songTicksPerBeat) + 1;
        let noteEndBeat = Math.round((note.ticksFromStart + note.duration) / this._songTicksPerBeat) + 1;

        for (let i = 0; i < possibleTonics.length; i++) {
            for (let j = noteStartBeat - beatsWindow; j < noteEndBeat + beatsWindow; j++) {
                if (j < 1 || j > this._numberOfBeats) { continue; }
                this._probabilities[possibleTonics[i]][j] += (note.duration * note.volume) / 100;
            }
        }

        for (let i = noteStartBeat; i < noteEndBeat; i++) {
            let durationInsideBeat = this._songTicksPerBeat;
            let ticksFromSongStartOfBeat = (i - 1) * this._songTicksPerBeat;
            if (note.ticksFromStart > ticksFromSongStartOfBeat) {
                durationInsideBeat -= (note.ticksFromStart - ticksFromSongStartOfBeat);
            }
            let noteEndTick = note.ticksFromStart + note.duration;
            let beatEndTick = ticksFromSongStartOfBeat + this._songTicksPerBeat;
            if (noteEndTick < beatEndTick) {
                durationInsideBeat -= (beatEndTick - noteEndTick);
            }
            this._notePower[note.pitch % 12][i] += note.volume * durationInsideBeat;

        }

    }
    // Given a pitch (for ex. C) return the indexes of the arrays that may be tonic, because their
    // scales include that pitch (in the example some possible tonics are F, G, Dm, that have indexes
    // of 5, 7 and 14 respectively)
    private getPossibleTonicsForNote(pitch: number): number[] {
        let returnArray = [];
        // Major scales
        returnArray.push(pitch % 12);
        returnArray.push((pitch + 7) % 12);
        returnArray.push((pitch + 5) % 12);
        returnArray.push((pitch + 10) % 12);
        returnArray.push((pitch + 15) % 12);
        returnArray.push((pitch + 20) % 12);
        returnArray.push((pitch + 1) % 12);
        // Minor scales
        returnArray.push((pitch % 12) + 12);
        returnArray.push((pitch + 1) % 12 + 12);
        returnArray.push((pitch + 2) % 12 + 12);
        returnArray.push((pitch + 3) % 12 + 12);
        returnArray.push((pitch + 4) % 12 + 12);
        returnArray.push((pitch + 5) % 12 + 12);
        returnArray.push((pitch + 7) % 12 + 12);
        returnArray.push((pitch + 9) % 12 + 12);
        returnArray.push((pitch + 10) % 12 + 12);

        return returnArray;
    }

    private getTonicAtBeatFirstTry(beat: number): Tonic {
        let maxProb = 0;
        let tonic: Tonic = new Tonic();
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

    // Because the notes in a major scale are mostly the same as in the corresponding minor
    // we do this extra step to differentiate them
    private correctMinorMajorProblem() {
        for (let beat = 1; beat < this._numberOfBeats; beat++) {
            // We only may have to make a correction when it was calculated as major
            if (this._tonic[beat].mode === ScaleMode.Major) {
                let pitchMajor = this._tonic[beat].pitch;
                let pitchMinor = (pitchMajor + 9) % 12;
                let j = 1;
                // find the next n consecutive beats with the same tonic
                while (this._tonic[beat + j].pitch === this._tonic[beat].pitch &&
                    this._tonic[beat + j].mode === this._tonic[beat].mode) {
                    j++;
                }
                // calculate the total power of the tonic of the major scale and the power of
                // the tonic of the corresponding minor in the period
                let powerOfMaj = 0;
                let powerOfMin = 0;
                for (let i = beat; i < beat + j - 1; i++) {
                    powerOfMaj += this._notePower[pitchMajor][i];
                    powerOfMin += this._notePower[pitchMinor][i];
                }

                // we now compare the 2 powers to decide which one is correct
                if (powerOfMin > powerOfMaj) {
                    for (let i = beat; i < beat + j - 1; i++) {
                        this._tonic[i].pitch = pitchMinor;
                        this._tonic[i].mode = ScaleMode.Minor;
                    }
                }
            }

        }
    }

}