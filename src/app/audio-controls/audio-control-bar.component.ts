import { Component, Input, OnChanges, SimpleChange, HostListener, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { AudioControlsService } from './audio-controls.service';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json';
import { SliderSoretComponent } from '../shared/slider-soret.component';
import { AudioControlEvent } from '../shared/audio-control-event';

declare var MIDIjs: any;

@Component({
    selector: 'audio-control-bar',
    templateUrl: './audio-control-bar.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class AudioControlBarComponent implements OnChanges {
    @Input() song: SongJson;
    @ViewChild(SliderSoretComponent)
    private audioControlBarSlider: SliderSoretComponent;
    subscriptionAudioEvents: Subscription;
    mouseDown: boolean = false;
    sliderPositionAtStart: number = 0;
    sliderLastReportedPosition: number = 0;
    isPlaying: boolean = false;

    constructor(
        private _midi2JsonService: Midi2JsonService,
        private _audioControlsService: AudioControlsService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    ngOnChanges() {
        this._audioControlsService.initialize(this.song);
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.play:
                this.handlePlayEvent();
                break;
            case AudioControlsEventTypes.stop:
                this.handleStopEvent();
                break;

            case AudioControlsEventTypes.musicProgress:
                this.musicProgress(event.data);
                break;
            case AudioControlsEventTypes.goToEnd:
                this.handleGoToEnd();
                break;
            case AudioControlsEventTypes.musicStopped:
                this.isPlaying = false;
                break;
        }
    }

    private handleGoToEnd() {
        this.isPlaying = false;
        this.audioControlBarSlider.setValue(1);
        this.sliderLastReportedPosition = 1;
    }
    private handlePlayEvent() {
        this.isPlaying = true;
        this.sliderPositionAtStart = this.sliderLastReportedPosition;
        let eventData = this.sliderPositionAtStart;
        this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.playStartPositionCalculated, eventData);
    }

    private handleStopEvent() {
        this.isPlaying = false;
        this.audioControlBarSlider.setValue(0);
        this.sliderLastReportedPosition = 0;
    }

    private musicProgress(elapsedTimeInSeconds: number) {
        // the following check is needed because after clicking play, the first musicProgress event
        // arrives before than the play event.
        if (elapsedTimeInSeconds === 0) {
            return;
        }
        let totalDuration = this.song.durationInSeconds * (1 - this.sliderPositionAtStart);
        if (totalDuration === 0) {
            console.log('Unexpected song progress event because the total duration of the part of the song to play is 0');
            return;
        }
        let newSliderPosition = elapsedTimeInSeconds / totalDuration + this.sliderPositionAtStart;
        this.audioControlBarSlider.setValue(newSliderPosition);
        this.sliderLastReportedPosition = newSliderPosition;
    }

    // value is a number between 0 and 1
    // this method is called when the user moves the slide
    public sliderMoved(value) {
        if (this.isPlaying) {
            this.isPlaying = false;
            this._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.pause);
            let self = this;
            setTimeout(function () {
                self.isPlaying = true;
                self._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play);
            }, 1000);
        }
        this.sliderLastReportedPosition = value;
    }
}
