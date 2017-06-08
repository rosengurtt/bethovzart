// The chord class is defined by the notes playing in the chord
// Several methods provide characteristics of the chord, for example which intervals it has,
// if it is a major or minor chord, if it has a 7th, etc.
import { TrackNote } from '../midi/track-note';
import { ChordType } from './chord-type.enum';

export class Chord {
    private _pitches: number[];
    private _intervals: number[]; // A place to save them, so they don't have to be recalculated
    private _notes: TrackNote[];
    private _startTime: number;
    private _duration: number;

    constructor(notes: TrackNote[], start = 0, dur = 0) {
        this._notes = notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
        this._startTime = start;
        this._duration = dur;
    }

    public add(note: TrackNote) {
        // If we already have a note with this pitch, don't add it
        for (let i = 0; i < this._notes.length; i++) {
            if (this._notes[i].pitch === note.pitch) { return; }
        }
        this._pitches = null;
        this._intervals = null;
        this._notes.push(note);
        this._notes = this._notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
    }

    public removeAt(i: number) {
        if (i < 0 || i >= this._notes.length) { return; }
        this._pitches = null;
        this._intervals = null;
        this._notes = this._notes.splice(i, 1);
        this._notes = this._notes.sort((n1: TrackNote, n2: TrackNote) => n1.pitch - n2.pitch);
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

    // For example Major, Minor, Major 7
    public getType(): ChordType {
        let intervals = this.getIntervalsFromRoot();
        // Basic Triads
        if (intervals.length === 3) {
            if (this.hasPerfectFifth()) {
                if (this.isMajor()) {
                    return ChordType.Major;
                } else if (this.isMinor()) {
                    return ChordType.Minor;
                } else if (this.hasPerfectFourth) {
                    return ChordType.Sus;
                }
            } else if (this.hasAugmentedFifth() && this.isMajor()) {
                return ChordType.Augmented;
            } else if (this.hasDiminishedFifth() && this.isMinor()) {
                return ChordType.Diminished;
            }
        }
        // Basic 7ths
        if (this.hasThird() && this.hasSeventh()) {
            if (intervals.length === 4) {
                if (this.hasPerfectFifth()) {
                    if (this.isMajor() && this.hasMajorSeventh()) {
                        return ChordType.Major7;
                    } else if (this.isMinor() && this.hasMinorSeventh()) {
                        return ChordType.Minor7;
                    } else if (this.isMinor() && this.hasMajorSeventh()) {
                        return ChordType.Minor7Major;
                    } else if (this.isMajor() && this.hasMinorSeventh()) {
                        return ChordType.Dominant7;
                    }
                } else if (this.hasDiminishedFifth() && this.isMinor() && this.hasMinorSeventh()) {
                    return ChordType.HalfDiminished;
                } else if (this.hasDiminishedFifth() && this.isMinor() && this.hasMajorSixth()) {
                    return ChordType.Diminished;
                }
            } else if (intervals.length === 3) {
                if (this.isMajor() && this.hasMajorSeventh()) {
                    return ChordType.Major7;
                } else if (this.isMinor() && this.hasMinorSeventh()) {
                    return ChordType.Minor7;
                } else if (this.isMinor() && this.hasMajorSeventh()) {
                    return ChordType.Minor7Major;
                }
            } else if (this.hasNinth()) {
                if (this.isMajor() && this.hasMajorSeventh()) {
                    return ChordType.Major9;
                }
                if (this.isMinor() && this.hasMinorSeventh()) {
                    return ChordType.Minor9;
                }
            }
        }
        // Ninth without seventh
        if (this.hasNinth() && this.hasPerfectFifth()) {
            if (this.isMajor()) {
                return ChordType.Major9;
            }
            if (this.isMinor()) {
                return ChordType.Minor9;
            }
            return ChordType.Unknown;
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

    private hasPerfectFourth(): boolean {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 5) {
                return true;
            }
        }
        return false;
    }

    private hasPerfectFifth(): boolean {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 7) {
                return true;
            }
        }
        return false;
    }

    private hasDiminishedFifth() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 6) {
                return true;
            }
        }
        return false;
    }

    private hasAugmentedFifth() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 8) {
                return true;
            }
        }
        return false;
    }

    private hasMajorSixth() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 9) {
                return true;
            }
        }
        return false;
    }

    private hasMajorSeventh() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 11) {
                return true;
            }
        }
        return false;
    }

    private hasMinorSeventh() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 10) {
                return true;
            }
        }
        return false;
    }

    private hasNinth() {
        let intervals = this.getIntervalsFromRoot();
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === 2) {
                return true;
            }
        }
        return false;
    }
    private hasThird() {
        return (this.isMajor() || this.isMinor());
    }
    private hasSeventh() {
        return (this.hasMinorSeventh() || this.hasMajorSeventh());
    }
    private getIntervalsFromRoot(): number[] {
        let rootIndex = this.getRootIndex();
        return this.intervalsFromNote(rootIndex);
    }
    public getRoot(): number {
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