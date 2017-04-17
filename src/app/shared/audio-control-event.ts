import { AudioControlsEventTypes } from './audio-controls-event-types.enum';

export class AudioControlEvent {
    constructor(public type: AudioControlsEventTypes, public data: any) {
    }
}