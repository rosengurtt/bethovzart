import { Component, Input, AfterViewChecked, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json/song-json';
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
    svgBoxId = 'svgBox' + this.trackNotesNumber;
    svgBox: any;  // html svg element where the music is shown graphically
    svgBoxWidth: number;
    progressBarId = 'progressBar' + this.trackNotesNumber;
    trackInfo: string;
    muteButtonCurrentImage: string = './app/assets/images/speakerOn.png';
    imageSpeakerOn = './app/assets/images/speakerOn.png';
    imageSpeakerOff = './app/assets/images/speakerOff.png';
    trackIsMuted: boolean;
    trackIsSolo: boolean;
    soloUnsolo: string; // text that shows if track is playing solo or not
    initialVolume: number;

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
            case AudioControlsEventTypes.trackSolo:
                if (event.data !== this.trackNumber) {
                    this.muteButtonCurrentImage = this.imageSpeakerOff;
                    this.trackIsMuted = true;
                    this.soloUnsolo = 'Solo';
                }
                break;
            case AudioControlsEventTypes.trackUnsolo:
                if (event.data !== this.trackNumber) {
                    this.muteButtonCurrentImage = this.imageSpeakerOn;
                    this.trackIsMuted = false;
                    this.soloUnsolo = 'Solo';
                }
                break;
        }
    }

    ngOnInit() {
        // Populate information section
        this.trackNumber = this.song.notesTracks[this.trackNotesNumber].trackNumber;
        // let thisTrackInfo = this.song.notesTracks[this.trackNotesNumber];
        let track = this.song.tracks[this.trackNumber];

        if (track.channel !== 9) {
            this.trackInfo = GeneralMidiInstrument.GetInstrumentName(track.Instrument);
        }
        else {
            this.trackInfo = 'Drums';
        }
        this.trackInfo += ' - Channel ' + (track.channel + 1);

        if (this.song.notesTracks.length > 1) {
            this.soloUnsolo = 'Solo';
        } else {
            this.soloUnsolo = '';
        }
        let thisTrack = this.song.tracks[this.trackNumber];
        this.initialVolume = thisTrack.Volume;
    }

    ngAfterViewChecked() {
        if (!this.isInitialized) {
            this.initialize();
            this._trackDisplayService.initialize(this.song);
            //  this._trackDisplayService.drawTrackGraphic(this.trackNotesNumber);
            this.isInitialized = true;
        }
    }
    private initialize() {
        this.trackIsMuted = false;
        this.trackIsSolo = false;
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

    public toggleSolo() {
        this.trackIsSolo = !this.trackIsSolo;
        if (this.trackIsSolo) {
            this.soloUnsolo = 'Unsolo';
            this.muteButtonCurrentImage = this.imageSpeakerOn;
            this.trackIsMuted = false;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.trackSolo, this.trackNumber);
        } else {
            this.soloUnsolo = 'Solo';
            this.muteButtonCurrentImage = this.imageSpeakerOn;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.trackUnsolo, this.trackNumber);
        }
    }

    public volumeChange(vol) {
        let eventData: any = { trackNumber: this.trackNumber, volume: vol };
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.volumeChange, eventData);
    }
}