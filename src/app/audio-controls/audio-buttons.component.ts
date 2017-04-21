import { Component, Input, OnChanges, SimpleChange, HostListener } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Song } from '../songs/song';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlEvent } from '../shared/audio-control-event';

declare var MIDIjs: any;

@Component({
    selector: 'audio-buttons',
    templateUrl: './audio-buttons.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class AudioButtonsComponent {
    song: Song;
    @Input() selectedSongId: string;
    subscriptionAudioEvents: Subscription;
    mouseDown: boolean = false;
    isPlaying: boolean = false;
    loadFinished: boolean;

    constructor(
        private _audioControlsService: AudioControlsService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.musicStarted:
                this.isPlaying = true;
                break;
            case AudioControlsEventTypes.musicStopped:
                this.isPlaying = false;
                break;
        }
    }

    playSong() {
        this.isPlaying = true;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play);

    }

    pauseSong() {
        this.isPlaying = false;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.pause);
    }
    stopSong() {
        this.isPlaying = false;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
    }

    goToBeginning() {
        if (this.isPlaying) {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
        }
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToBeginning);
        if (this.isPlaying) {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play);
        }
    }
    goToEnd() {
        if (this.isPlaying) {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
            this.isPlaying = false;
        }
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToEnd);
    }
    zoomIn() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.zoomIn);
    }

    zoomOut() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.zoomOut);
    }
    moveLeft() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.moveLeft);
    }
    moveRight() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.moveRight);
    }
    moveUp() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.moveUp);
    }
    moveDown() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.moveDown);
    }
}

