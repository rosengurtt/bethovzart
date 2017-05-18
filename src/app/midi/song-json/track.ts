import { MidiEvent } from '../midi-event';
import { Binary2String } from '../../shared/binary-to-string';
import { Channel } from './channel';
import { Instrument } from '../midi-codes/instrument.enum';
import { MidiEventType } from '../midi-codes/midi-event-type';

// The MidiFile.js object returns tracks as a simple array of midi events
// We add some information that is generic to the track, like the channel and the instrument
// Since we have "normalized" the midi file there is only one channel in each track
export class Track {
    private _channel: number;
    private _instrument: Instrument;
    private _volume: number;
    public events: MidiEvent[];
    readonly _maxVolume = 127;

    constructor(trackData: MidiEvent[]) {
        this.events = trackData;
    }
    get channel(): number {
        if (!this._channel) {
            if (this.events.length > 0) {
                let i = 0;
                while (typeof this.events[i].channel === 'undefined' && i < this.events.length) {
                    i++;
                }
                this._channel = this.events[i].channel;
            }
        }
        return this._channel;
    }

    get Volume(): number {
        if (!this._volume) {
            this._volume = this.getVolume();
        }
        return this._volume;
    }




    get Notes(): MidiEvent[] {
        return this.getEventsOfType(MidiEventType.Note, MidiEventType.PitchBend);
    }

    get Instrument(): Instrument {
        if (!this._instrument) {
            for (let i = 0; i < this.events.length; i++) {
                let event = this.events[i];
                if (event.isPatchChange()) {
                    this._instrument = event.param1;
                    break;
                }
            }
        }
        return this._instrument;
    }

    // It makes an average if there are many volume values. In theory the average should
    // take in consideration how many notes or how long each volume applies, but I can't be bothered
    // The volume is returned as a number between 0 and 1, rather than 0 and 127 as in Midi
    private getVolume() {
        let total = 0;
        let quantity = 0;
        let volumeChangeEvents: number[] = this.getVolumeChanges();
        for (let i = 0; i < volumeChangeEvents.length; i++) {
            total += volumeChangeEvents[i];
            quantity++;
        }
        if (quantity > 0) { return (total / (quantity * this._maxVolume)); }
        return 0.5;
    }

    // returns a clone of the original event. This is to avoid modifying the original song
    public getLatestEventOfTypeBeforeTick(type: MidiEventType, tick: number): MidiEvent {
        if (tick === 0) { return null; }
        for (let i = this.events.length - 1; i > 0; i--) {
            let event = this.events[i];
            if (event.ticksSinceStart >= tick) { continue; }
            if (event.isOfType(type)) {
                let returnObject = new MidiEvent(event);
                return returnObject;
            }
        }
        return null;
    }

    public getSliceStartingFromTick(tick: number, volume?: number) {
        let sliceTrack: Track = new Track([]);
        if (tick > 0) {
            sliceTrack = this.cloneLastEventOfTypeBeforeTickAndAddItToBeginning(MidiEventType.Tempo, tick,
                sliceTrack);
            sliceTrack = this.cloneLastEventOfTypeBeforeTickAndAddItToBeginning(MidiEventType.VolumeChange, tick,
                sliceTrack);
            sliceTrack = this.cloneLastEventOfTypeBeforeTickAndAddItToBeginning(MidiEventType.PatchChange, tick,
                sliceTrack);
            sliceTrack = this.cloneLastEventOfTypeBeforeTickAndAddItToBeginning(MidiEventType.TimeSignature, tick,
                sliceTrack);
            sliceTrack = this.cloneLastEventOfTypeBeforeTickAndAddItToBeginning(MidiEventType.PanChange, tick,
                sliceTrack);
        }
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].ticksSinceStart < tick) { continue; }
            let event = new MidiEvent(this.events[i]);
            event.ticksSinceStart -= tick;
            sliceTrack.events.push(event);
        }
        // All tracks must end with an end of track event. Add one if necessary
        let lastEventOfTheTrack = sliceTrack.events[sliceTrack.events.length - 1];

        if (lastEventOfTheTrack) {
            sliceTrack.addEndOfTrackEvent();
        }
        // if the user has operated the track volume slider, update volume of track
        if (typeof volume !== 'undefined') {
            sliceTrack = this.changeSliceVolume(volume, sliceTrack);
        }
        return sliceTrack;
    }

    private changeSliceVolume(volume: number, track: Track): Track {

        let trackHasVolumeChangeEvents = false;
        for (let i = 0; i < track.events.length; i++) {
            let event = track.events[i];
            if (event.isVolumeChange()) {
                event.param2 = volume * this._maxVolume;
                trackHasVolumeChangeEvents = true;
            }
        }
        // if track has not volume change events, insert one at the beginning
        if (!trackHasVolumeChangeEvents) {
            let event = new MidiEvent({
                delta: 0, type: 8, subtype: 11, param1: 7, param2: volume * this._maxVolume,
                ticksSinceStart: 0, channel: track._channel
            });

            // unshift inserts at the begining of the array
            track.events.unshift(event);
        }
        return track;
    }


    // Looks for the last event of type "type" before a specific tick, creates a clone with a delta of 0, and adds it to the events
    // array of the track
    private cloneLastEventOfTypeBeforeTickAndAddItToBeginning(type: MidiEventType, tick: number, track: Track): Track {
        let event = this.getLatestEventOfTypeBeforeTick(type, tick);
        if (event) {
            let clone = new MidiEvent(event);
            clone.delta = 0;
            clone.ticksSinceStart = 0;
            track.events.push(clone);
        }
        return track;
    }



    private getVolumeChanges(): number[] {
        let returnArray: number[] = [];
        let volumeChangeEvents = this.getEventsOfType(MidiEventType.VolumeChange);
        for (let i = 0; i < volumeChangeEvents.length; i++) {
            returnArray.push(volumeChangeEvents[i].param2);
        }
        return returnArray;
    }

    public getEventsOfType(type1: MidiEventType, type2?: MidiEventType): MidiEvent[] {
        let returnArray: MidiEvent[] = [];
        for (let j = 0; j < this.events.length; j++) {
            let event: MidiEvent = this.events[j];
            if (event.isOfType(type1)) {
                returnArray.push(event);
            }
            if (type2 && event.isOfType(type2)) {
                returnArray.push(event);
            }
        }
        return returnArray;
    }

    public addEndOfTrackEvent() {
        let ticksSinceStartOfLastEvent = 0;
        if (this.events.length > 0) {
            // If there is already an end of track event don't add another one
            let lastEvent: MidiEvent = this.events[this.events.length - 1];
            if (lastEvent.isEndOfTrack()) {
                return;
            }
            ticksSinceStartOfLastEvent = this.events[this.events.length - 1].ticksSinceStart;
        }
        this.events.push(new MidiEvent({
            delta: 0, type: 0xFF, subtype: 0x2F, ticksSinceStart: ticksSinceStartOfLastEvent,
            channel: this._channel
        }));
    }

}