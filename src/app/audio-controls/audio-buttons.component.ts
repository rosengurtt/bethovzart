import { Component, Input, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json/song-json';
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
export class AudioButtonsComponent implements OnChanges {
    @Input() song: SongJson;
    @Input() selectedSongId: string;
    subscriptionAudioEvents: Subscription;
    mouseDown: boolean = false;
    loadFinished: boolean;
    bpm: string;
    collapsed = false;

    constructor(
        private _audioControlsService: AudioControlsService,
        private _midiFileCheckerService: MidiFileCheckerService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    ngOnChanges() {
        this.resetTempo();
    }
    resetTempo() {
        let tempo = this.song.tempoEvents[0].tempoBPM;
        tempo = tempo ? tempo : 120;
        this.bpm = tempo.toFixed(0);
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.tempoChange, this.bpm);

    }
    tempoChange(newValue) {
        this.bpm = newValue;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.tempoChange, this.bpm);
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.musicStarted:
                // this.downloadeame("midifile.txt", this._audioControlsService.songPartToPlay);
                // let check = this._midiFileCheckerService.check(new Uint8Array(this._audioControlsService.songPartToPlay));
                break;
        }
    }

    playSong() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play);

    }

    pauseSong() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.pause);
    }
    stopSong() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.stop);
    }

    goToBeginning() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToBeginning);
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.restart);
    }
    goToEnd() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.goToEnd);
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.restart);
    }
    zoomxIn() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.zoomxIn);
    }

    zoomxOut() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.zoomxOut);
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

    collapseExpand() {
        this.collapsed = !this.collapsed;
        if (this.collapsed) {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.collapseDisplay);
        } else {
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.expandDisplay);
        }
    }
    getCollapseButtonClass(): any {
        if (!this.collapsed) {
            return { 'glyphicon': true, 'glyphicon-menu-up ': true, 'glyphicon-menu-down': false };
        }
        return { 'glyphicon': true, 'glyphicon-menu-up': false, 'glyphicon-menu-down': true };
    }

    reset() {
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.reset);
        this.resetTempo();
    }
    //  used for debugging. Allows to save buffer to disk
    // private downloadeame(filename, buffer) {
    //     let base64encoded = Binary2base64.convert(buffer);
    //     let element = document.createElement('a');
    //     element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64encoded));
    //     element.setAttribute('download', filename);

    //     element.style.display = 'none';
    //     document.body.appendChild(element);

    //     element.click();

    //     document.body.removeChild(element);
    // }
}

