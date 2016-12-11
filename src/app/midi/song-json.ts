import { midiEvent } from './midi-event';
import { notesTrack } from './notes-track';
import { trackRange } from './track-range';
import { trackNote } from './track-note';
import { instrument } from './midi-codes/instrument.enum'


export class songJson {
    format: number;
    ticksPerBeat: number;
    tracks: midiEvent[][];
    private _instruments: instrument[][]; // each track may have different instruments
    private _durationInTicks: number = -1;
    private _notesTracks: notesTrack[];
    private _durationInSeconds: number = -1;
    private _tempoEvents: midiEvent[];


    constructor(format?: number, ticksPerBeat?: number, tracks?: midiEvent[][]) {
        this.format = format;
        this.ticksPerBeat = ticksPerBeat;
        this.tracks = tracks;
    }

    get instruments(): instrument[][] {
        if (!this._instruments) {
            this._instruments = this.getInstruments();
        }
        return this._instruments;

    }
    private getInstruments(): instrument[][] {
        let returnObject: instrument[][] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let instrumentsInThisTrack: instrument[] = [];
            for (let j = 0; j < this.tracks[i].length; j++) {
                let event: midiEvent = this.tracks[i][j];
                if (event.isPatchChange()) {
                    instrumentsInThisTrack.push(event.param1)
                }
            }
            returnObject.push(instrumentsInThisTrack);
        }
        return returnObject;
    }

    get tracksCount(): number {
        return this.tracks.length;
    }
    get durationInTicks(): number {
        if (this._durationInTicks === -1) {
            this._durationInTicks = this.getSongDurationInTicks();
        }
        return this._durationInTicks;
    }

    get notesTracks(): notesTrack[] {
        if (!this._notesTracks) {
            this._notesTracks = this.getNotesSequences();
        }
        return this._notesTracks;
    }

    get durationInSeconds(): number {
        if (this._durationInSeconds === -1) {
            this._durationInSeconds = this.getSongDurationInSeconds();
        }
        return this._durationInSeconds;
    }

    get tempoEvents(): midiEvent[] {
        if (!this._tempoEvents) {
            this._tempoEvents = this.getTempoEvents();
        }
        return this._tempoEvents;
    }

    //Returns the lowest and highest pitches in a track
    private getTrackRange(t: trackNote[]): trackRange {
        let returnValue = new trackRange(500, 0);
        for (let i = 0; i < t.length; i++) {
            let pitch = t[i].pitch;
            if (pitch < returnValue.minPitch) returnValue.minPitch = pitch;
            if (pitch > returnValue.maxPitch) returnValue.maxPitch = pitch;
        }
        return returnValue;
    }

    //Returns the number of ticks in the whole song
    private getSongDurationInTicks(): number {
        let duration: number = 0;
        for (let i = 0; i < this._notesTracks.length; i++) {
            if (this._notesTracks[i].notesSequence.length > 0) {
                let trackLength: number = this._notesTracks[i].notesSequence.length;
                let lastNote: trackNote = this._notesTracks[i].notesSequence[trackLength - 1]
                let timeStartsLastNote: number = lastNote.ticksFromStart;
                let durationLastNote = lastNote.duration;
                let endTrack: number = timeStartsLastNote + durationLastNote;
                if (endTrack > duration) {
                    duration = endTrack;
                }
            }
        }
        return duration;
    }
    private getSongDurationInSeconds(): number {
        let duration: number = 0;
        let tempoEvents = this.getTempoEvents();
        for (let i = 0; i < tempoEvents.length; i++) {
            let tempo: number = tempoEvents[i].tempoBPM;
            let start: number = tempoEvents[i].ticksSinceStart;
            let end: number;
            if (i < tempoEvents.length - 1)
                end = tempoEvents[i + 1].ticksSinceStart;
            else
                end = this.getSongDurationInTicks();
            duration += ((end - start) / this.ticksPerBeat) / (tempo / 60);
        }
        return duration;
    }
    private getTempoEvents(): midiEvent[] {
        let returnValue: midiEvent[] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            for (let j = 0; j < track.length; j++) {
                if (track[j].type == 255 && track[j].subtype == 81) {
                    returnValue.push(track[j]);
                }
            }
        }
        return returnValue;
    }
    // Convert the midi tracks that have all sort of events, to tracks that have only notes on and notes off
    // In addition, a 'range' property provides the max and minimum pitch for each track
    private getNotesSequences(): notesTrack[] {
        let musicTracks: notesTrack[] = [];
        for (let k = 0; k < this.tracks.length; k++) {
            let trackNotes = this.getNotes(this.tracks[k]);
            if (trackNotes.length > 0) {
                let range: trackRange = this.getTrackRange(trackNotes);
                musicTracks.push(new notesTrack(trackNotes, range))
            }
        }
        return musicTracks;
    }

    // Used to get the events in a midi track that correspond to notes on and notes off
    private getNotes(midiTrack: midiEvent[]): trackNote[] {
        let noteOn: number = 9;
        let noteOff: number = 8;
        let returnArray: trackNote[] = [];
        let timeSinceStart = 0;
        let trackLength = midiTrack.length;
        for (let i = 0; i < trackLength; i++) {
            let midiEvent = midiTrack[i];
            timeSinceStart += midiEvent.delta;
            //Loof for note one events         
            if (midiEvent.type === 8 && midiEvent.subtype === noteOn) {
                let pitch = midiEvent.param1;
                let duration = 0;
                //Find corresponding note off
                for (let j = i + 1; j < trackLength; j++) {
                    let nextEvent = midiTrack[j];
                    duration += nextEvent.delta;
                    if (nextEvent.type === 8 && nextEvent.subtype === noteOff && nextEvent.param1 === pitch) {
                        //Found the note off, save the point
                        let note = new trackNote(timeSinceStart, pitch, duration);
                        returnArray.push(note);
                        break;
                    }
                }
            }
        }
        return returnArray;
    }

    // Returns a new song that is a slice of the current song, starting from a specific tick
    public getSliceStartingFromTick(tick: number): songJson {
        if (tick === 0) {
            return this;
        }
        let slice: songJson = new songJson(this.format, this.ticksPerBeat, null);
        slice.tracks = [];
        for (let i: number = 0; i < this.tracks.length; i++) {
            let track: midiEvent[] = this.tracks[i];
            let sliceTrack: midiEvent[] = [];
            let discarded: midiEvent[] = [];
            let totalKept: number = 0;
            let totalDiscarded: number = 0;
            for (let item of this.getLatestEventOfEachTypeInTrackPriorToTick(tick, i)) {
                item.delta = 0;
                item.ticksSinceStart = 0;
                sliceTrack.push(item);
            }
            for (let j: number = 0; j < track.length; j++) {
                let event: midiEvent = track[j];
                if (event.ticksSinceStart >= tick) {
                    event.ticksSinceStart -= tick;
                    sliceTrack.push(event);
                    totalKept++;
                }
                else {
                    discarded.push(event);
                    totalDiscarded++;
                }

            }
            slice.tracks.push(sliceTrack);
        } console.log(slice);
        return slice;
    }
    private getLatestEventOfEachTypeInTrackPriorToTick(tick: number, track: number): midiEvent[] {
        let latestEventOfType: { [type: string]: midiEvent } = {};
        for (let event of this.tracks[track]) {
            if (event.ticksSinceStart > tick) {
                break;
            }
            if (event.isTempo()) {
                latestEventOfType["tempo"] = event;
            }
            if (event.isVolumeChange()) {
                latestEventOfType["volumeChange"] = event;
            }
            if (event.isTimeSignature()) {
                latestEventOfType["timeSignature"] = event;
            }
            if (event.isPatchChange()) {
                latestEventOfType["patchChange"] = event;
            }
            if (event.isPanChange()) {
                latestEventOfType["panChange"] = event;
            }
            if (event.isEndOfTrack()) {
                latestEventOfType["endOfTrack"] = event;
            }
        }
        let returnValue: midiEvent[] = [];
        for (let type of ["tempo", "volumeChange", "timeSignature", "patchChange", "panChange", "endOfTrack"])
            if (latestEventOfType[type]) {
                returnValue.push(latestEventOfType[type]);
            }

        return returnValue;
    }
}