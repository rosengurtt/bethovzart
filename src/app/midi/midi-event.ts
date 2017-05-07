import { MidiEventType } from './midi-codes/midi-event-type';

export class MidiEvent {
    delta: number;
    ticksSinceStart?: number;
    index?: number;
    length?: number;
    param1?: number;
    param2?: number;
    param3?: number;
    param4?: number;
    subtype: number;
    type: number;
    data?: number[];
    tempo?: number;
    tempoBPM?: number;
    channel?: number;
    key?: number;
    scale?: number;

    constructor(object?: any) {
        if (object) {
            if (typeof object.delta !== 'undefined') { this.delta = object.delta; }
            if (typeof object.ticksSinceStart !== 'undefined') { this.ticksSinceStart = object.ticksSinceStart; }
            if (typeof object.index !== 'undefined') { this.index = object.index; }
            if (typeof object.length !== 'undefined') { this.length = object.length; }
            if (typeof object.param1 !== 'undefined') { this.param1 = object.param1; }
            if (typeof object.param2 !== 'undefined') { this.param2 = object.param2; }
            if (typeof object.param3 !== 'undefined') { this.param3 = object.param3; }
            if (typeof object.param4 !== 'undefined') { this.param4 = object.param4; }
            if (typeof object.type !== 'undefined') { this.type = object.type; }
            if (typeof object.subtype !== 'undefined') { this.subtype = object.subtype; }
            if (typeof object.data !== 'undefined') { this.data = object.data; }
            if (typeof object.tempo !== 'undefined') { this.tempo = object.tempo; }
            if (typeof object.tempoBPM !== 'undefined') { this.tempoBPM = object.tempoBPM; }
            if (typeof object.channel !== 'undefined') { this.channel = object.channel; }
            if (typeof object.key !== 'undefined') { this.key = object.key; }
            if (typeof object.scale !== 'undefined') { this.scale = object.scale; }
        }
    }

    public cloneEvent(): MidiEvent {
        let returnValue = new MidiEvent();
        returnValue.delta = this.delta;
        returnValue.ticksSinceStart = this.ticksSinceStart;
        returnValue.index = this.index;
        returnValue.length = this.length;
        returnValue.param1 = this.param1;
        returnValue.param2 = this.param2;
        returnValue.param3 = this.param3;
        returnValue.param4 = this.param4;
        returnValue.subtype = this.subtype;
        returnValue.type = this.type;
        returnValue.data = this.data;
        returnValue.tempo = this.tempo;
        returnValue.tempoBPM = this.tempoBPM;
        returnValue.channel = this.channel;
        returnValue.key = this.key;
        returnValue.scale = this.scale;
        return returnValue;
    }
    public isOfType(type: MidiEventType): boolean {
        switch (type) {
            case MidiEventType.Note:
                return (this.type === 8 && (this.subtype === 9) || (this.subtype === 8));
            case MidiEventType.NoteOn:
                return (this.type === 8 && this.subtype === 9);
            case MidiEventType.NoteOff:
                return (this.type === 8 && this.subtype === 8);
            case MidiEventType.PatchChange:
                return (this.type === 8 && this.subtype === 12);
            case MidiEventType.PanChange:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 10);
            case MidiEventType.Modulation:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 1);
            case MidiEventType.KeySignature:
                return (this.type === 255 && this.subtype === 89);
            case MidiEventType.MidiPort:
                return (this.type === 255 && this.subtype === 33);
            case MidiEventType.Effect1Depht:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 91);
            case MidiEventType.Effect2Depht:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 92);
            case MidiEventType.Effect3Depht:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 93);
            case MidiEventType.EndOfTrack:
                return (this.type === 255 && this.subtype === 47);
            case MidiEventType.TrackName:
                return (this.type === 255 && this.subtype === 3);
            case MidiEventType.ResetAllControllers:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 121);
            case MidiEventType.PressureChange:
                return (this.type === 8 && this.subtype === 13);
            case MidiEventType.PitchBend:
                return (this.type === 8 && this.subtype === 14);
            case MidiEventType.VolumeChange:
                return (this.type === 8 && this.subtype === 11 && this.param1 === 7);
            case MidiEventType.Tempo:
                return (this.type === 255 && this.subtype === 81);
            case MidiEventType.TimeSignature:
                return (this.type === 255 && this.subtype === 88);
        }
    }
    public isNote(): boolean {
        return this.isOfType(MidiEventType.Note);
    }
    public isNoteOn(): boolean {
        return this.isOfType(MidiEventType.NoteOn);
    }
    public isNoteOff(): boolean {
        return this.isOfType(MidiEventType.NoteOff);
    }

    public isPatchChange(): boolean {
        return this.isOfType(MidiEventType.PatchChange);
    }
    public isPressureChange(): boolean {
        return this.isOfType(MidiEventType.PressureChange);
    }
    public isPitchBend(): boolean {
        return this.isOfType(MidiEventType.PitchBend);
    }
    public isModulation(): boolean {
        return this.isOfType(MidiEventType.Modulation);
    }
    public isVolumeChange(): boolean {
        return this.isOfType(MidiEventType.VolumeChange);
    }
    public isPanChange(): boolean {
        return this.isOfType(MidiEventType.PanChange);
    }
    public isResetAllControllers(): boolean {
        return this.isOfType(MidiEventType.ResetAllControllers);
    }

    public isTempo(): boolean {
        return this.isOfType(MidiEventType.Tempo);
    }
    public isEffect1Depht(): boolean {
        return this.isOfType(MidiEventType.Effect1Depht);
    }
    public isEffect3Depht(): boolean {
        return this.isOfType(MidiEventType.Effect3Depht);
    }
    public isMidiPort(): boolean {
        return this.isOfType(MidiEventType.MidiPort);
    }
    public isKeySignature(): boolean {
        return this.isOfType(MidiEventType.KeySignature);
    }
    public isTimeSignature(): boolean {
        return this.isOfType(MidiEventType.TimeSignature);
    }
    public isEndOfTrack(): boolean {
        return this.isOfType(MidiEventType.EndOfTrack);
    }
    public isTrackName(): boolean {
        return this.isOfType(MidiEventType.TrackName);
    }
    public isChannelIndependent(): boolean {
        if (this.isTempo() || this.isTimeSignature() || this.isKeySignature() || this.isResetAllControllers()){
            return true;
        }
        return false;
    }
}
