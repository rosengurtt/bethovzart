import { Component, Input, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { AudioButtonsComponent } from './audio-buttons.component';
import { Song } from '../songs/song';
import { AudioControlsEventsService } from './audio-controls-events.service';
import { Midi2JsonService } from '../midi/midi-to-json.service';

declare var MIDIjs: any;

@Component({
    selector: 'audio-controls',
    templateUrl: './audio-controls.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class AudioControlsComponent implements OnChanges {
    @Input() song: Song;
    mouseDown: boolean = false;
    isPlaying: boolean = false;

    constructor(private _midi2JsonService: Midi2JsonService,
        private _audioControlsEventsService: AudioControlsEventsService) {
    }


    async ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        // this.loadFinished = false;
        for (let propName in changes) {
            //     if (true) { // added this useless if so lint doesn't complain
            //         let changedProp = changes[propName];
            //         let from = JSON.stringify(changedProp.previousValue);
            //         let to = JSON.stringify(changedProp.currentValue);
            //         if (propName === 'selectedSongId' && to !== '') {
            //             await this.GetSongData();
            //             this._songDisplayService.songDisplay(this.song.jsonFile);
            //             this._audioControlsService.initialize(this.song.jsonFile);
            //         }
            //         this.loadFinished = true;
            //     }
        }
    }

    playSong() {
        // let songPartToPlay: ArrayBuffer = this._audioControlsService.getSongBytesFromStartingPosition();
        // // this.download("midifile.txt", songPartToPlay);
        // // let check = this._midiFileCheckerService.check(songPartToPlay);
        // MIDIjs.play(songPartToPlay);
        // this.isPlaying = true;
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.play, );

    }

    pauseSong() {
        // if (this.isPlaying) {
        //     this._songDisplayService.songPaused();
        //     this._audioControlsService.songPaused();
        //     MIDIjs.stop();
        //     this.isPlaying = false;
        //     this._playControlsEventsService.raiseEvent(PlayControlEvents.pause);
        // }
    }
    stopSong() {
        // if (this.isPlaying) {
        //     MIDIjs.stop();
        //     this.isPlaying = false;
        // }
        // this._songDisplayService.songStopped();
        // this._audioControlsService.songStopped();
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.stop);
    }

    goToBeginning() {
        // if (this.loadFinished && !this.isPlaying) {
        //     this._audioControlsService.goToBeginning();
        //     this._playControlsEventsService.raiseEvent(PlayControlEvents.goToBeginning);
        // }
    }
    goToEnd() {
        // if (this.loadFinished && !this.isPlaying) {
        //     this._audioControlsService.goToEnd();
        //     this._playControlsEventsService.raiseEvent(PlayControlEvents.goToEnd);
        // }
    }
    zoomIn() {
        // this._songDisplayService.changeZoom(1);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.zoomIn);
    }

    zoomOut() {
        // this._songDisplayService.changeZoom(-1);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.zoomOut);
    }
    moveLeft() {
        // this._songDisplayService.moveWindow(-1, 0);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.moveLeft);
    }
    moveRight() {
        // this._songDisplayService.moveWindow(1, 0);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.moveRight);
    }
    moveUp() {
        // this._songDisplayService.moveWindow(0, -1);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.moveUp);
    }
    moveDown() {
        // this._songDisplayService.moveWindow(0, 1);
        // this._playControlsEventsService.raiseEvent(PlayControlEvents.moveDown);
    }

    // used for debugging. Allows to save buffer to disk
    // private download(filename, buffer) {
    //     let base64encoded = Binary2base64.convert(buffer);
    //     let element = document.createElement('a');
    //     element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64encoded));
    //     element.setAttribute('download', filename);

    //     element.style.display = 'none';
    //     document.body.appendChild(element);

    //     element.click();

    //     document.body.removeChild(element);
    // }

    public ProgressControlClicked(evt: MouseEvent) {
        this.mouseDown = true;
    }

    public MoveControl(evt: MouseEvent) {
        // if (this.loadFinished && this.mouseDown) {
        //     this._audioControlsService.moveControl(evt);
        // }
    }

    public MouseUp() {
        this.mouseDown = false;
    }

    // The following events are raised by the midijs library

    // @HostListener('PlayStarted')
    // MidiSoundStarted() {
    //     this._audioControlsService.songStarted();
    // }
    // @HostListener('PlayFinished')
    // MidiSoundFinished() {
    //     this._audioControlsService.songStopped();
    // }
    // @HostListener('PlayProgress')
    // MidiSoundProgress(event: any) {
    //     this._audioControlsService.updateProgress(event);
    // }
}

