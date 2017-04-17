import { Component, Input, AfterViewChecked, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json';
import { TrackNote } from '../midi/track-note';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlEvent } from '../shared/audio-control-event';
import { GeneralMidiInstrument } from '../shared/general-midi-instrument';
import { TrackDisplayService } from '../song-display/track-display.service';

declare var MIDIjs: any;

@Component({
    selector: 'track-display',
    templateUrl: './track-display.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class TrackDisplayComponent implements AfterViewChecked, OnInit {
    @Input() song: SongJson;
    @Input() trackNotesNumber: number;
    trackNumber: number;
    subscriptionAudioEvents: Subscription;
    isInitialized = false;
    songIsPlaying: boolean;
    svgns: string = 'http://www.w3.org/2000/svg';
    svgBoxId = 'svgBox' + this.trackNotesNumber;
    svgBox: any;  // html svg element where the music is shown graphically
    svgBoxWidth: number;
    trackHeight: number = 150; // height in pixels. When there are many tracks, we may want to reduce it
    progressBarId = 'progressBar' + this.trackNotesNumber;
    zoomIndex: number;  // is the index inside the zoomSteps array
    zoomSteps: number[] = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
    scrollDisplacementX: number; // when the user has zoomed in, and only part of the image is
    // shown, scrollDisplacement is the length from the left border
    // shown to the beginning of the song (outside the image)
    scrollDisplacementY: number;
    colorMusicBar: string = 'rgb(200,180,170)';
    colorProgressBar: string = 'rgb(200,0,0)';
    noteDotRadio: number = 1;
    trackInfo: string;
    muteButtonCurrentImage: string = './app/assets/images/speakerOn.png';
    imageSpeakerOn = './app/assets/images/speakerOn.png';
    imageSpeakerOff = './app/assets/images/speakerOff.png';
    trackIsMuted: boolean;

    constructor(
        private _trackDisplayService: TrackDisplayService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.play:
                this._trackDisplayService.songStarted(event.data, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.stop:
                this._trackDisplayService.songStopped(this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.pause:
                this._trackDisplayService.songPaused(this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.goToBeginning: break;
            case AudioControlsEventTypes.goToEnd: break;
            case AudioControlsEventTypes.zoomIn:
                this._trackDisplayService.changeZoom(1, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.zoomOut:
                this._trackDisplayService.changeZoom(-1, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.moveUp:
                this._trackDisplayService.moveWindow(0, -1, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.moveDown:
                this._trackDisplayService.moveWindow(0, 1, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.moveLeft:
                this._trackDisplayService.moveWindow(-1, 0, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.moveRight:
                this._trackDisplayService.moveWindow(1, 0, this.trackNotesNumber);
                break;
            case AudioControlsEventTypes.musicProgress:
                this._trackDisplayService.updateProgress(event.data.locationProgressControl, this.trackNotesNumber);

        }
    }

    ngOnInit() {
        // Populate information section
        this.trackInfo = '';
        this.trackNumber = this.song.notesTracks[this.trackNotesNumber].trackNumber;
        if (this.song.notesTracks[this.trackNotesNumber].trackName) {
            this.trackInfo = this.song.notesTracks[this.trackNotesNumber].trackName + '-';
        }
        let thisTrackInfo = this.song.notesTracks[this.trackNotesNumber];
        for (let i = 0; i < thisTrackInfo.instrument.length; i++) {
            let instrumentCode: number = thisTrackInfo.instrument[i];
            this.trackInfo += GeneralMidiInstrument.GetInstrumentName(instrumentCode) + ', ';
        }
        // Remove last comma
        this.trackInfo = this.trackInfo.slice(0, -2);

    }

    ngAfterViewChecked() {
        if (!this.isInitialized) {
            this.initialize();
            this._trackDisplayService.initialize(this.song, this.trackNotesNumber);
            this._trackDisplayService.drawGraphic(this.trackNotesNumber);
            this.isInitialized = true;
        }
    }
    private initialize() {
        this.trackIsMuted = false;
        this.muteButtonCurrentImage = this.imageSpeakerOn;
    }


    public toggleMute() {
        this.trackIsMuted = !this.trackIsMuted;
        if (this.trackIsMuted) {
            this.muteButtonCurrentImage = this.imageSpeakerOff;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.trackMuted, this.trackNumber);
        } else {
            this.muteButtonCurrentImage = this.imageSpeakerOn;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.trackUnmuted, this.trackNumber);
        }
    }
}