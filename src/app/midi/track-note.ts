export class trackNote {
    ticksFromStart: number;
    pitch: number;
    duration: number;
    constructor(ticks: number, pitch: number, dur: number) {
        this.ticksFromStart = ticks;
        this.pitch = pitch;
        this.duration = dur;
    }
}