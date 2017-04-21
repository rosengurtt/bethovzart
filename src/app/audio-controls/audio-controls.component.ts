import { Component, Input } from '@angular/core';

import { SongJson } from '../midi/song-json';
import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';

declare var MIDIjs: any;

@Component({
    selector: 'audio-controls',
    templateUrl: './audio-controls.component.html'
})
export class AudioControlsComponent {
    @Input() song: SongJson;

    constructor(
        private _audioControlsService: AudioControlsService,
        private _audioControlsEventsService: AudioControlsEventsService) {
    }
    // The following events are raised by the midijs library

    MidiSoundStarted() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.musicStarted);
    }
    MidiSoundFinished() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.musicStopped);
    }
    MidiSoundProgress(event: any) {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.musicProgress, event.time);
    }
}
