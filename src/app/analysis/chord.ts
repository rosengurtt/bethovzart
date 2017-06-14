// The chord class is defined by the notes playing in the chord
// Several methods provide characteristics of the chord, for example which intervals it has,
// if it is a major or minor chord, if it has a 7th, etc.
import { TrackNote } from '../midi/track-note';
import { ChordType } from './chord-type.enum';
import { AlterationType } from './alteration-type.enum';

export class Chord {
    private _pitches: number[];
    private _intervals: number[]; // A place to save them, so they don't have to be recalculated
    private _notes: TrackNote[];
    private _chordType: ChordType;
    private _root: number;
    public startTime: number;
    public duration: number;

    constructor(notes: TrackNote[] = [], start = 0, dur = 0) {
        if (notes) {
            this._notes = notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
        } else {
            this._notes = [];
        }
        this.startTime = start;
        this.duration = dur;
    }

    public add(note: TrackNote) {
        // If we already have a note with this pitch, don't add it
        for (let i = 0; i < this._notes.length; i++) {
            if (this._notes[i].pitch === note.pitch) { return; }
        }
        this._notes.push(note);
        this._notes = this._notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
    }

    public removeAt(i: number) {
        if (i < 0 || i >= this._notes.length) { return; }
        this.resetCalculatedValues();
        this._notes = this._notes.splice(i, 1);
        this._notes = this._notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
    }
    private resetCalculatedValues() {
        this._pitches = null;
        this._intervals = null;
        this._chordType = null;
    }
    get notes() {
        return this._notes;
    }
    get pitches() {
        if (!this._pitches) {
            this._pitches = [];
            for (let i = 0; i < this._notes.length; i++) {
                this._pitches.push(this._notes[i].pitch);
            }
        }
        return this._pitches;
    }

    public getLower(): number {
        return this.pitches[0];
    }
    public getHigher(): number {
        return this.pitches[this.pitches.length - 1];
    }
    public isMajor(): boolean {
        let thirds = this.getThirds();
        if (thirds.length === 1 && thirds[0] === 4) {
            return true;
        }
        return false;
    }
    public isMinor(): boolean {
        let thirds = this.getThirds();
        if (thirds.length === 1 && thirds[0] === 3) {
            return true;
        }
        return false;
    }

    get chordType() {
        if (!this._chordType) {
            this._chordType = this.getType();
        }
        return this._chordType;
    }
    // For example Major, Minor, Major 7
    public getType(): ChordType {
        // If there are less than 2 notes, we don't have a chord
        if (!this._notes || this._notes.length <= 1) {
            return ChordType.NotAchord;
        }
        if (this._notes.length === 2) {
            if (this.intervals[0] === 7) {
                return ChordType.Power;
            }
        }
        let intervals = this.getIntervalsFromRoot();

        // Basic Triads
        if (this.equal(intervals, [4, 7]) || this.equal(intervals, [0, 4, 7])) {
            return ChordType.Major;
        }
        if (this.equal(intervals, [3, 7]) || this.equal(intervals, [0, 3, 7])) {
            return ChordType.Minor;
        }
        if (this.equal(intervals, [5, 7]) || this.equal(intervals, [0, 5, 7])) {
            return ChordType.Sus;
        }
        if (this.equal(intervals, [7]) || this.equal(intervals, [0, 7])) {
            return ChordType.Power;
        }
        if (this.equal(intervals, [4, 8]) || this.equal(intervals, [0, 4, 8])) {
            return ChordType.Augmented;
        }
        if (this.equal(intervals, [3, 6]) || this.equal(intervals, [0, 3, 6]) ||
            this.equal(intervals, [3, 6, 9]) || this.equal(intervals, [0, 3, 6, 9])) {
            return ChordType.Diminished;
        }

        // 7ths
        if (this.equal(intervals, [4, 7, 11]) || this.equal(intervals, [0, 4, 7, 11])) {
            return ChordType.Major7;
        }
        if (this.equal(intervals, [3, 7, 10]) || this.equal(intervals, [0, 3, 7, 10])) {
            return ChordType.Minor7;
        }
        if (this.equal(intervals, [3, 7, 11]) || this.equal(intervals, [0, 3, 7, 11])) {
            return ChordType.Minor7Major;
        }
        if (this.equal(intervals, [3, 6, 10]) || this.equal(intervals, [0, 3, 6, 10])) {
            return ChordType.HalfDiminished;
        }
        if (this.equal(intervals, [4, 7, 10]) || this.equal(intervals, [0, 4, 7, 10])) {
            return ChordType.Dominant7;
        }

        // 9ths
        if (this.equal(intervals, [2, 4, 7, 11]) || this.equal(intervals, [0, 2, 4, 7, 11]) ||
            this.equal(intervals, [2, 4, 11]) || this.equal(intervals, [0, 2, 4, 11]) ||
            this.equal(intervals, [2, 4, 7]) || this.equal(intervals, [0, 2, 4, 7])) {
            return ChordType.Major9;
        }
        if (this.equal(intervals, [2, 3, 7, 10]) || this.equal(intervals, [0, 2, 3, 7, 10]) ||
            this.equal(intervals, [2, 3, 10]) || this.equal(intervals, [0, 2, 3, 10]) ||
            this.equal(intervals, [2, 3, 7]) || this.equal(intervals, [0, 2, 3, 7])) {
            return ChordType.Minor9;
        }
        return ChordType.Unknown;
    }

    private equal(a: number[], b: number[]): boolean {
        if (a.length !== b.length) { return false; }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) { return false; }
        }
        return true;
    }

    // representation is the chord written in standard notation, like Am7 or C#m9
    // the parameter sharpOrFlat is used when the root can be represented for ex. by
    // C# or Db
    public getRepresentation(sharpOrFlat: AlterationType): string {
        if (this.chordType !== ChordType.Unknown && this.chordType !== ChordType.NotAchord) {
            return this.getRootRepresentation(sharpOrFlat) + this.getTypeRepresentation();
        }
        return '';
    }

    private getRootRepresentation(sharpOrFlat: AlterationType): string {
        switch (this.root % 12) {
            case 0: return 'C';
            case 1:
                if (sharpOrFlat === AlterationType.sharp) {
                    return 'C#';
                } else { return 'Db'; }
            case 2: return 'D';
            case 3:
                if (sharpOrFlat === AlterationType.sharp) {
                    return 'D#';
                } else { return 'Eb'; }
            case 4: return 'E';
            case 5: return 'F';
            case 6:
                if (sharpOrFlat === AlterationType.sharp) {
                    return 'F#';
                } else { return 'Gb'; }
            case 7: return 'G';
            case 8:
                if (sharpOrFlat === AlterationType.sharp) {
                    return 'G#';
                } else { return 'Ab'; }
            case 9: return 'A';
            case 10:
                if (sharpOrFlat === AlterationType.sharp) {
                    return 'A#';
                } else { return 'Bb'; }
            case 11: return 'B';
        }
    }
    private getTypeRepresentation(): string {
        switch (this.chordType) {
            case ChordType.Major: return '';
            case ChordType.Minor: return 'm';
            case ChordType.Sus: return 'sus';
            case ChordType.Augmented: return 'aug';
            case ChordType.Diminished: return 'dim';
            case ChordType.Major7: return 'M7';
            case ChordType.Minor7: return 'm7';
            case ChordType.Major9: return '9';
            case ChordType.Minor9: return 'm9';
            case ChordType.Dominant7: return '7';
            case ChordType.Minor7Major: return 'mM7';
            case ChordType.HalfDiminished: return 'm7b5';
            case ChordType.Power: return '';
        }
    }

    // Returns the intervals corresponding to thirds (3 semitones for minor, 4 for major)
    // A normal chord has 1 third, but it can have none, or theoretically could have 2
    private getThirds(): number[] {
        let intervals = this.getIntervalsFromRoot();
        let thirds: number[] = [];
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 3 || intervals[i] === 4) {
                thirds.push(intervals[i]);
            }
        }
        return thirds;
    }

    private getIntervalsFromRoot(): number[] {
        let rootIndex = this.getRootIndex();
        return this.intervalsFromNote(rootIndex);
    }
    get root() {
        if (!this._root) {
            this._root = this.getRoot();
        }
        return this._root;
    }
    public getRoot(): number {
        if (!this._notes || this._notes.length === 0) {
            return null;
        }
        return this.notes[this.getRootIndex()].pitch;
    }

    // To get the root we assign a probability to each note, and the we select the one with the highest
    // The probability is calculated based in the intervals formed from the note
    // Intervals of 5ths and 3rds give hight probability, intervals of tritones lower the probability
    public getRootIndex() {
        let probabilitiesOfBeingRoot: number[] = []
        for (let i = 0; i < this.notes.length; i++) {
            let intervals = this.intervalsFromNote(i);
            let probabilitySoFar = 0;
            for (let j = 0; j < intervals.length; j++) {
                probabilitySoFar += this.probabilityContributionToBeARoot(intervals[j]);
            }
            probabilitiesOfBeingRoot.push(probabilitySoFar);
        }
        return this.getIndexOfElementWithHighestProbability(probabilitiesOfBeingRoot);
    }

    private probabilityContributionToBeARoot(interval: number): number {
        switch (interval) {
            case 0:         // Intervals of octaves and 5ths give high values
            case 7:
                return 10;
            case 3:         // Intervals of 3ds give intermediate values
            case 4:
                return 5;
            case 10:       // Intervals of 7ths give mid-low values 
            case 11:
                return 4;
            case 5:         // Intervals of 4ths, 6ths and 7ths give mid-low values
                return 3;
            case 1:         // Intervals of 2nds and 6ths  give low values
            case 2:
            case 8:
            case 9:
                return 2;
            case 6:
                return -10;     // Tritones give a negative value
        }
    }

    private getIndexOfElementWithHighestProbability(probabilitiesArray: number[]): number {
        let maxProbability = Math.max(...probabilitiesArray);
        for (let i = 0; i < probabilitiesArray.length; i++) {
            if (probabilitiesArray[i] === maxProbability) {
                return i;
            }
        }
    }

    // Gilven the index of the note in the notes array, returns the intervals from this note to the
    // other notes in the chord.
    // For the notes with lower pitch (compared with the reference), instead of returning a negative 
    // number, it returns the "complement". 
    // For ex. for a negative value of -5 (a forth below), it calculates +7 (a fifth above)
    private intervalsFromNote(i: number): number[] {
        let returnArray = [];
        for (let j = 0; j < this.notes.length; j++) {
            // Absolute distance
            let interval = this.notes[j].pitch - this.notes[i].pitch;
            // Distance in less than an octave
            interval = interval % 12;
            // Calculate the complement if negative
            if (interval < 0) {
                interval += 12;
            }
            returnArray.push(interval);
        }
        // Remove duplicates
        returnArray = Array.from(new Set(returnArray));
        returnArray = returnArray.sort((n1: number, n2: number) => n1 - n2);
        return returnArray;
    }
    get intervals(): number[] {

        if (!this._intervals) {
            this._intervals = [];
            for (let i = 0; i < this.pitches.length - 1; i++) {
                for (let j = i + 1; j < this.pitches.length; j++) {
                    this._intervals.push((this.pitches[j] - this.pitches[i]) % 24);
                }
            }
            // Sort array
            this._intervals = this._intervals.sort((n1: number, n2: number) => n1 - n2);
            // Remove duplicates
            this._intervals = Array.from(new Set(this._intervals));
        }
        return this._intervals;
    }

}