// Defines the max and min pitch in a track
export class TrackRange {
    minPitch: number;
    maxPitch: number;
    public constructor(min: number, max: number) {
        this.minPitch = min;
        this.maxPitch = max;
    }
}