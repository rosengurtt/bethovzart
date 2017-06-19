// represents a noteOn/noteOff event in a track
// the duration is in ticks
export class TrackNote {
    ticksFromStart: number;
    pitch: number;
    volume: number;
    duration: number;
    bended: boolean;    // means that actually another note was played previously, 
    // and by bending it reached the pitch of this note, so we 
    // created this noted as a replacement to the bending events
    constructor(ticks: number, pitch: number, dur: number, bended: boolean, volume = 127) {
        this.ticksFromStart = ticks;
        this.pitch = pitch;
        this.duration = dur;
        this.bended = bended;
        this.volume = volume;
    }
}