import { MidiEvent } from '../midi-event';
import { Binary2String } from '../../shared/binary-to-string';
import { Channel } from './channel';
import { Instrument } from '../midi-codes/instrument.enum';
import { MidiEventType } from '../midi-codes/midi-event-type';

// The MidiFile.js object returns tracks as a simple array of midi events
// We add some information that is generic to the track, like which _channels
// are used, what instrument plays each channel, if the track has a name, etc.
export class Track {
    private _name: string;
    private _channels: Channel[];
    private _volume: number;
    public events: MidiEvent[];
    readonly _maxVolume = 127;

    constructor(trackData: MidiEvent[]) {
        this.events = trackData;
    }
    // When the events in the track change, we want to recalculate the name, channels, etc.
    public reset() {
        this._name = null;
        this._channels = null;
    }

    get Name(): string {
        if (!this._name) {
            this._name = this.getTrackName();
        }
        return this._name;
    }
    get Volume(): number {
        if (!this._volume) {
            this._volume = this.getVolume();
        }
        return this._volume;
    }

    get Channels(): Channel[] {
        if (!this._channels) {
            this._channels = this.getChannels();
        }
        return this._channels;
    }

    get TempoEvents(): MidiEvent[] {
        return this.getEventsOfType(MidiEventType.Tempo);
    }

    get Notes(): MidiEvent[] {
        return this.getEventsOfType(MidiEventType.Note);
    }

    get Instruments(): Instrument[] {
        let returnArray: Instrument[] = [];
        if (this.Channels) {
            for (let i = 0; i < this.Channels.length; i++) {
                for (let j = 0; j < this.Channels[i].instruments.length; j++) {
                    returnArray.push(this.Channels[i].instruments[j]);
                }
            }
        }
        return returnArray;
    }

    // It makes an average if there are many volume values. In theory the average should
    // take in consideration how many notes or how long each volume applies, but I can't be bothered
    // The volume is returned as a number between 0 and 1, rather than 0 and 127 as in Midi
    private getVolume() {
        let total = 0;
        let quantity = 0;
        for (let i = 0; i < this.Channels.length; i++) {
            for (let j = 0; j < this.Channels[i].volume.length; j++) {
                total += this.Channels[i].volume[j];
                quantity++;
            }
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
        if (lastEventOfTheTrack && !lastEventOfTheTrack.isOfType(MidiEventType.EndOfTrack)) {
            sliceTrack.events.push(this.createEndOfTrackEvent());
        }
        // if the user has operated the track volume slider, update volume of track
        if (typeof volume !== 'undefined') {
            sliceTrack = this.changeSliceVolume(volume, sliceTrack);
        }
        // After adding all the events, reset the track so the name, channels, etc are recalculated
        sliceTrack.reset();
        return sliceTrack;
    }

    private changeSliceVolume(volume: number, track: Track): Track {
        // insert volume events to each channel, in case the track has no volume events
        for (let i = 0; i < track.Channels.length; i++) {
            let event = new MidiEvent({
                delta: 0, type: 8, subtype: 11, param1: 7, param2: volume * this._maxVolume,
                ticksSinceStart: 0, channel: track.Channels[i].number
            });
            // unshift inserts at the begining of the array
            track.events.unshift(event);
        }
        for (let i = 0; i < track.events.length; i++) {
            let event = track.events[i];
            if (event.isVolumeChange()) {
                event.param2 = volume * this._maxVolume;
            }
        }
        return track;
    }
    private createEndOfTrackEvent() {
        return new MidiEvent({ delta: 0, type: 0xFF, subtype: 0x2F, ticksSinceStart: 0 });
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

    private getTrackName(): string {
        for (let j = 0; j < this.events.length; j++) {
            let event: MidiEvent = this.events[j];
            if (event.isTrackName()) {
                return Binary2String.convert(event.data);
            }
        }
        return '';
    }

    private getChannels(): Channel[] {
        let channelNumbers = [];
        for (let j = 0; j < this.events.length; j++) {
            let event: MidiEvent = this.events[j];
            let mySet = new Set(channelNumbers);
            if (event.channel && !mySet.has(event.channel)) {
                channelNumbers.push(event.channel);
            }
        }
        let returnObject: Channel[] = [];
        for (let i = 0; i < channelNumbers.length; i++) {
            let channel = new Channel(channelNumbers[i]);
            channel.instruments = this.getChannelInstruments(channel.number);
            channel.volume = this.getChannelVolumeChanges(channel.number);
            returnObject.push(channel);
        }
        return returnObject;
    }

    private getChannelInstruments(channelNumber: number): Instrument[] {
        let returnArray: number[] = [];
        let patchChangeEvents = this.getEventsOfType(MidiEventType.PatchChange);
        for (let i = 0; i < patchChangeEvents.length; i++) {
            if (channelNumber === patchChangeEvents[i].channel) {
                returnArray.push(patchChangeEvents[i].param1);
            }
        }
        return returnArray;
    }

    private getChannelVolumeChanges(channelNumber: number): number[] {
        let returnArray: number[] = [];
        let volumeChangeEvents = this.getEventsOfType(MidiEventType.VolumeChange);
        for (let i = 0; i < volumeChangeEvents.length; i++) {
            if (channelNumber === volumeChangeEvents[i].channel) {
                returnArray.push(volumeChangeEvents[i].param2);
            }
        }
        return returnArray;
    }

    public getEventsOfType(type: MidiEventType, onlyFirst?: boolean): MidiEvent[] {
        let returnArray: MidiEvent[] = [];
        for (let j = 0; j < this.events.length; j++) {
            let event: MidiEvent = this.events[j];
            if (event.isOfType(type)) {
                returnArray.push(event);
            }
        }
        return returnArray;
    }

}