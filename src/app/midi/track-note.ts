// represents a noteOn/noteOff event in a track
export class TrackNote {
    ticksFromStart: number;
    pitch: number;
    duration: number;
    constructor(ticks: number, pitch: number, dur: number) {
        this.ticksFromStart = ticks;
        this.pitch = pitch;
        this.duration = dur;
    }
}