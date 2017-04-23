import { Component, Input, OnChanges, SimpleChange, HostListener } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Song } from '../songs/song';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlEvent } from '../shared/audio-control-event';
import { Binary2base64 } from '../shared/binary-to-base64';
import { MidiFileCheckerService } from '../midi/midi-file-checker.service';

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
        private _midiFileCheckerService: MidiFileCheckerService,
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
                //    this.download("midifile.txt", this._audioControlsService.songPartToPlay);
                let check = this._midiFileCheckerService.check(new Uint8Array(this._audioControlsService.songPartToPlay));
                break;
            case AudioControlsEventTypes.musicStopped:
            case AudioControlsEventTypes.endTimeReached:
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
    //  used for debugging. Allows to save buffer to disk
    private download(filename, buffer) {
        let base64encoded = Binary2base64.convert(buffer);
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64encoded));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
}

