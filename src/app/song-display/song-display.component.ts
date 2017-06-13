import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlEvent } from '../shared/audio-control-event';
import { GeneralMidiInstrument } from '../shared/general-midi-instrument';
import { TrackDisplayService } from '../song-display/track-display.service';


declare var MIDIjs: any;

@Component({
    selector: 'song-display',
    templateUrl: './song-display.component.html'
})
export class SongDisplayComponent implements OnChanges, OnInit {
    @Input() song: SongJson;
    @Input() isCollapsed: boolean;
    subscriptionAudioEvents: Subscription;
    isInitialized = false;

    constructor(
        private _trackDisplayService: TrackDisplayService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }


    ngOnChanges() {
        if (this.isInitialized) {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
        }
    }
    ngOnInit() {
        this.isInitialized = true;
    }
    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.play:
                this._trackDisplayService.songStarted(event.data);
                break;
            case AudioControlsEventTypes.stop:
                this._trackDisplayService.songPausedOrStopped();
                break;
            case AudioControlsEventTypes.pause:
                this._trackDisplayService.songPausedOrStopped();
                break;
            case AudioControlsEventTypes.zoomxIn:
                this._trackDisplayService.changeZoomX(1);
                break;
            case AudioControlsEventTypes.zoomxOut:
                this._trackDisplayService.changeZoomX(-1);
                break;
            case AudioControlsEventTypes.moveUp:
                this._trackDisplayService.moveWindow(0, -1);
                break;
            case AudioControlsEventTypes.moveDown:
                this._trackDisplayService.moveWindow(0, 1);
                break;
            case AudioControlsEventTypes.moveLeft:
                this._trackDisplayService.moveWindow(-1, 0);
                break;
            case AudioControlsEventTypes.moveRight:
                this._trackDisplayService.moveWindow(1, 0);
                break;
            case AudioControlsEventTypes.musicProgress:
                this._trackDisplayService.updateProgress(event.data);

        }
    }






}

