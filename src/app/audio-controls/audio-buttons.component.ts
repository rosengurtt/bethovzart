import { Component, Input, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { Song } from '../songs/song';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';

declare var MIDIjs: any;

@Component({
    selector: 'audio-buttons',
    templateUrl: './audio-buttons.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class AudioButtonsComponent {
    song: Song;
    @Input() selectedSongId: string;
    mouseDown: boolean = false;
    isPlaying: boolean = false;
    loadFinished: boolean;

    constructor(
        private _audioControlsService: AudioControlsService,
        private _audioControlsEventsService: AudioControlsEventsService
    ) {
    }

    playSong() {
        let songPartToPlay: ArrayBuffer = this._audioControlsService.getSongBytesFromStartingPosition();
        // this.download("midifile.txt", songPartToPlay);
        // let check = this._midiFileCheckerService.check(songPartToPlay);
        MIDIjs.play(songPartToPlay);
        this.isPlaying = true;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play,
        this._audioControlsService.positionControlLocationAtStartInTicks);

    }

    pauseSong() {
        if (this.isPlaying) {
            this._audioControlsService.songPaused();
            MIDIjs.stop();
            this.isPlaying = false;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.pause);
        }
    }
    stopSong() {
        if (this.isPlaying) {
            MIDIjs.stop();
            this.isPlaying = false;
        }
        this._audioControlsService.songStopped();
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
    }

    goToBeginning() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToBeginning();
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToBeginning);
        }
    }
    goToEnd() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToEnd();
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToEnd);
        }
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

