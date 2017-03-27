export class midiEvent {
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
            if (object.delta) { this.delta = object.delta; }
            if (object.ticksSinceStart) { this.ticksSinceStart = object.ticksSinceStart; }
            if (object.index) { this.index = object.index; }
            if (object.length) { this.length = object.length; }
            if (object.param1) { this.param1 = object.param1; }
            if (object.param2) { this.param2 = object.param2; }
            if (object.param3) { this.param3 = object.param3; }
            if (object.param4) { this.param4 = object.param4; }
            if (object.type) { this.type = object.type; }
            if (object.subtype) { this.subtype = object.subtype; }
            if (object.data) { this.data = object.data; }
            if (object.tempo) { this.tempo = object.tempo; }
            if (object.tempoBPM) { this.tempoBPM = object.tempoBPM; }
            if (object.channel) { this.channel = object.channel; }
            if (object.key) { this.key = object.key; }
            if (object.scale) { this.scale = object.scale; }
        }
    }

    public cloneEvent(): midiEvent {
        let returnValue = new midiEvent();
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
    public isNote(): boolean {
        return (this.isNoteOn() || this.isNoteOff())
    }
    public isNoteOn(): boolean {
        return (this.type === 8 && this.subtype === 9);
    }
    public isNoteOff(): boolean {
        return (this.type === 8 && this.subtype === 8);
    }

    public isPatchChange(): boolean {
        return (this.type === 8 && this.subtype === 12)
    }
    public isPressureChange(): boolean {
        return (this.type === 8 && this.subtype === 13)
    }
    public isPitchBend(): boolean {
        return (this.type === 8 && this.subtype === 14);
    }
    public isModulation(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 1);
    }
    public isVolumeChange(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 7);
    }
    public isPanChange(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 10);
    }
    public isResetAllControllers(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 121);
    }

    public isTempo(): boolean {
        return (this.type === 255 && this.subtype === 81);
    }
    public isEffect1Depht(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 91);
    }
    public isEffect3Depht(): boolean {
        return (this.type === 8 && this.subtype === 11 && this.param1 === 93);
    }
    public isMidiPort(): boolean {
        return (this.type === 255 && this.subtype === 33);
    }
    public isKeySignature(): boolean {
        return (this.type === 255 && this.subtype === 89);
    }
    public isTimeSignature(): boolean {
        return (this.type === 255 && this.subtype === 88);
    }
    public isEndOfTrack(): boolean {
        return (this.type === 255 && this.subtype === 47);
    }
    public isTrackName(): boolean {
        return (this.type === 255 && this.subtype === 3);
    }
}
