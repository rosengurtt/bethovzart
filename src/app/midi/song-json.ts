import { MidiEvent } from './midi-event';
import { NotesTrack } from './notes-track';
import { TrackRange } from './track-range';
import { TrackNote } from './track-note';
import { Instrument } from './midi-codes/instrument.enum';
import { TimeSignature } from './time-signature';
import { Binary2String } from '../shared/binary-to-string';


export class SongJson {
    format: number;
    ticksPerBeat: number;
    tracks: MidiEvent[][];
    private _instruments: Instrument[][]; // each track may have different instruments
    private _trackNames: string[]; // The name of the track when defined with a FF 03 event
    private _durationInTicks: number = -1;
    private _notesTracks: NotesTrack[];
    private _durationInSeconds: number = -1;
    private _tempoEvents: MidiEvent[];
    private _timeSignature: TimeSignature;
    private _trackVolumes: number[];


    constructor(format?: number, ticksPerBeat?: number, tracks?: MidiEvent[][]) {
        this.format = format;
        this.ticksPerBeat = ticksPerBeat;
        this.tracks = tracks;
    }


    get instruments(): Instrument[][] {
        if (!this._instruments) {
            this._instruments = this.getInstruments();
        }
        return this._instruments;
    }

    private getInstruments(): Instrument[][] {
        let returnObject: Instrument[][] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let instrumentsInThisTrack: Instrument[] = [];
            for (let j = 0; j < this.tracks[i].length; j++) {
                let event: MidiEvent = this.tracks[i][j];
                if (event.isPatchChange()) {
                    if (instrumentsInThisTrack.indexOf(event.param1) === -1) {
                        instrumentsInThisTrack.push(event.param1)
                    }
                }
            }
            returnObject.push(instrumentsInThisTrack);
        }
        return returnObject;
    }

    get trackVolumes(): number[] {
        if (!this._trackVolumes) {
            this._trackVolumes = this.getTrackVolumes();
        }
        return this._trackVolumes;
    }

    private getTrackVolumes(): number[] {
        let returnObject: number[] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            for (let j = 0; j < this.tracks[i].length; j++) {
                let event: MidiEvent = this.tracks[i][j];
                if (event.isVolumeChange()) {
                    // returnObject[i]=event.param1
                    console.log("el volumen del track " + i)
                    console.log(event)
                }
            }
        }
        return returnObject;
    }
    get trackNames(): string[] {
        if (!this._trackNames) {
            this._trackNames = this.getTrackNames();
        }
        return this._trackNames;
    }
    
    private getTrackNames(): string[] {
        let returnObject: string[] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let thisTrackName = '';
            for (let j = 0; j < this.tracks[i].length; j++) {
                let event: MidiEvent = this.tracks[i][j];
                if (event.isTrackName()) {
                    thisTrackName = Binary2String.convert(event.data);
                    break;
                }
            }
            returnObject.push(thisTrackName);
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

    get notesTracks(): NotesTrack[] {
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

    get tempoEvents(): MidiEvent[] {
        if (!this._tempoEvents) {
            this._tempoEvents = this.getTempoEvents();
        }
        return this._tempoEvents;
    }

    // Returns the lowest and highest pitches in a track
    private getTrackRange(t: TrackNote[]): TrackRange {
        let returnValue = new TrackRange(500, 0);
        for (let i = 0; i < t.length; i++) {
            let pitch = t[i].pitch;
            if (pitch < returnValue.minPitch) { returnValue.minPitch = pitch; }
            if (pitch > returnValue.maxPitch) { returnValue.maxPitch = pitch; }
        }
        return returnValue;
    }

    // Returns the number of ticks in the whole song
    private getSongDurationInTicks(): number {
        let duration: number = 0;
        for (let i = 0; i < this._notesTracks.length; i++) {
            if (this._notesTracks[i].notesSequence.length > 0) {
                let trackLength: number = this._notesTracks[i].notesSequence.length;
                let lastNote: TrackNote = this._notesTracks[i].notesSequence[trackLength - 1]
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
            if (i < tempoEvents.length - 1) {
                end = tempoEvents[i + 1].ticksSinceStart;
            } else {
                end = this.getSongDurationInTicks();
            }
            duration += ((end - start) / this.ticksPerBeat) / (tempo / 60);
        }
        return duration;
    }
    private getTempoEvents(): MidiEvent[] {
        let returnValue: MidiEvent[] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            for (let j = 0; j < track.length; j++) {
                if (track[j].type === 255 && track[j].subtype === 81) {
                    returnValue.push(track[j]);
                }
            }
        }
        return returnValue;
    }
    // Convert the midi tracks that have all sort of events, to tracks that have only notes on and notes off
    // In addition, a 'range' property provides the max and minimum pitch for each track
    private getNotesSequences(): NotesTrack[] {
        let musicTracks: NotesTrack[] = [];
        for (let k = 0; k < this.tracks.length; k++) {
            let TrackNotes = this.getNotes(this.tracks[k]);
            if (TrackNotes.length > 0) {
                let range: TrackRange = this.getTrackRange(TrackNotes);
                let instrument: Instrument[] = this.instruments[k];
                let trackName: string = this.trackNames[k];
                musicTracks.push(new NotesTrack(TrackNotes, range, instrument, trackName, k));
            }
        }
        return musicTracks;
    }

    // Used to get the events in a midi track that correspond to notes on and notes off
    private getNotes(midiTrack: MidiEvent[]): TrackNote[] {
        let noteOn = 9;
        let noteOff = 8;
        let returnArray: TrackNote[] = [];
        let timeSinceStart = 0;
        let trackLength = midiTrack.length;
        for (let i = 0; i < trackLength; i++) {
            let midiEvent = midiTrack[i];
            timeSinceStart += midiEvent.delta;
            // Look for note one events         
            if (midiEvent.type === 8 && midiEvent.subtype === noteOn) {
                let pitch = midiEvent.param1;
                let duration = 0;
                // Find corresponding note off
                for (let j = i + 1; j < trackLength; j++) {
                    let nextEvent = midiTrack[j];
                    duration += nextEvent.delta;
                    if (nextEvent.type === 8 && nextEvent.subtype === noteOff && nextEvent.param1 === pitch) {
                        // Found the note off, save the point
                        let note = new TrackNote(timeSinceStart, pitch, duration);
                        returnArray.push(note);
                        break;
                    }
                }
            }
        }
        return returnArray;
    }

    // Returns a new song that is a slice of the current song, starting from a specific tick
    public getSliceStartingFromTick(tick: number, mutedTracks: number[] = []): SongJson {
        let slice: SongJson = new SongJson(this.format, this.ticksPerBeat, null);
        slice.tracks = [];
        for (let i = 0; i < this.tracks.length; i++) {
            if (mutedTracks.indexOf(i) > -1) {
                continue;
            }
            let track: MidiEvent[] = this.tracks[i];
            let sliceTrack: MidiEvent[] = [];
            let discarded: MidiEvent[] = [];
            let totalKept = 0;
            let totalDiscarded = 0;
            for (let item of this.getLatestEventOfEachTypeInTrackPriorToTick(tick, i)) {
                item.delta = 0;
                item.ticksSinceStart = 0;
                sliceTrack.push(item);
            }
            for (let j = 0; j < track.length; j++) {
                let event: MidiEvent = track[j];
                if (event.ticksSinceStart >= tick) {
                    sliceTrack.push(event);
                    totalKept++;
                } else {
                    discarded.push(event);
                    totalDiscarded++;
                }

            }
            slice.tracks.push(sliceTrack);
        }
        return slice;
    }
    private getLatestEventOfEachTypeInTrackPriorToTick(tick: number, track: number): MidiEvent[] {
        let latestEventOfType: { [type: string]: MidiEvent } = {};
        for (let event of this.tracks[track]) {
            if (event.ticksSinceStart > tick) {
                break;
            }
            if (event.isTempo()) {
                latestEventOfType['tempo'] = event;
            }
            if (event.isVolumeChange()) {
                latestEventOfType['volumeChange'] = event;
            }
            if (event.isTimeSignature()) {
                latestEventOfType['timeSignature'] = event;
            }
            if (event.isPatchChange()) {
                latestEventOfType['patchChange'] = event;
            }
            if (event.isPanChange()) {
                latestEventOfType['panChange'] = event;
            }
            if (event.isEndOfTrack()) {
                latestEventOfType['endOfTrack'] = event;
            }
        }
        let returnValue: MidiEvent[] = [];
        for (let type of ['tempo', 'volumeChange', 'timeSignature', 'patchChange', 'panChange', 'endOfTrack']) {
            if (latestEventOfType[type]) {
                returnValue.push(latestEventOfType[type]);
            }
        }

        return returnValue;
    }

    get timeSignature(): TimeSignature {
        if (!this._timeSignature) {
            this._timeSignature = this.getTimeSignature();
        }
        return this._timeSignature;
    }

    private getTimeSignature(): TimeSignature {
        for (let i = 0; i < this.tracks.length; i++) {
            for (let j = 0; j < this.tracks[i].length; j++) {
                let event: MidiEvent = this.tracks[i][j];
                if (event.isTimeSignature()) {
                    let returnObject = new TimeSignature();
                    returnObject.nn = event.param1;
                    returnObject.dd = event.param2;
                    returnObject.cc = event.param3;
                    returnObject.bb = event.param4;
                    return returnObject;
                }
            }
        }
        return null;
    }
    public getTicksPerBar(): number {
        if (!this.timeSignature) {
            return 0; // if there is no time signature info, can't draw bars
        }
        switch (this.timeSignature.dd) {
            case 1: // beat is a half note
                return this.timeSignature.nn * this.ticksPerBeat * 2;
            case 2: // beat is a quarter note
                return this.timeSignature.nn * this.ticksPerBeat;
            case 3: // beat is a corchea
                return this.timeSignature.nn * this.ticksPerBeat / 2;
            default: // unknown
                return 0;
        }
    }
}