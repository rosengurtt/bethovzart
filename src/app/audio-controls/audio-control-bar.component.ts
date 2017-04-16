import { Component, Input, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventsService } from './audio-controls-events.service';
import { AudioControlsEventTypes } from './audio-controls-event-types.enum';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json';

declare var MIDIjs: any;

@Component({
    selector: 'audio-control-bar',
    templateUrl: './audio-control-bar.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class AudioControlBarComponent implements OnChanges {
    @Input() song: SongJson;
    mouseDown: boolean = false;
    isPlaying: boolean = false;
    loadFinished: boolean;

    constructor(
        private _midi2JsonService: Midi2JsonService,
        private _audioControlsService: AudioControlsService,
        private _audioControlsEventsService: AudioControlsEventsService) {
    }

    ngOnChanges() {
        this._audioControlsService.initialize(this.song);
    }


    public ProgressControlClicked(evt: MouseEvent) {
        this.mouseDown = true;
    }

    public MoveControl(evt: MouseEvent) {
        if (this.mouseDown) {
            this._audioControlsService.moveControl(evt);
        }
    }

    public MouseUp() {
        this.mouseDown = false;
    }
}
