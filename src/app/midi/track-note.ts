// represents a noteOn/noteOff event in a track
// the duration is in ticks
export class TrackNote {
    ticksFromStart: number;
    pitch: number;
    duration: number;
    bended: boolean;    // means that actually another note was played previously, 
                        // and by bending it reached the pitch of this note, so we 
                        // created this noted as a replacement to the bending events
    constructor(ticks: number, pitch: number, dur: number, bended: boolean) {
        this.ticksFromStart = ticks;
        this.pitch = pitch;
        this.duration = dur;
        this.bended = bended;
    }
}