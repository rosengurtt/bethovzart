import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { SvgBoxService } from '../song-display/svg-box.service';


@Injectable()
export class TrackDisplayService {
    song: SongJson;
    subscriptionAudioEvents: Subscription;
    songIsPlaying: boolean;
    zoomIndex: number;  // is the index inside the zoomSteps array
    zoomSteps: number[] = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
    scrollDisplacementX: number; // when the user has zoomed in, and only part of the image is
    // shown, scrollDisplacement is the length from the left border
    // to the beginning of the song (outside the image)
    scrollDisplacementY: number;
    svgBoxIdPrefix = 'svgBox';
    progressBarIdPrefix = 'progressBar';
    moveStep: number = 0.7;    // How much the image move when clicking the arrow buttons. 70%
    sliderPositionAtStart: number = 0;

    constructor(
        private _audioControlsEventsService: AudioControlsEventsService,
        private _svgBoxService: SvgBoxService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    public initialize(song: SongJson, trackNotesNumber: number) {
        this.song = song;
        this.zoomIndex = 0;
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.songIsPlaying = false;
    }
    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.playStartPositionCalculated:
                this.sliderPositionAtStart = event.data;
                break;
        }
    }

    private zoom() {
        return this.zoomSteps[this.zoomIndex];
    }
    // ------------------------------------------------------------------------------
    // Responses to events
    // ------------------------------------------------------------------------------
    // stepSign is +1 for zoom in and -1 for zoom out
    public changeZoom(stepSign: number) {
        // if invalid parameter do nothing
        if (stepSign !== 1 && stepSign !== -1) {
            return;
        }
        this.zoomIndex += stepSign;
        if (this.zoomIndex < 0) {
            this.zoomIndex = 0;
        } else if (this.zoomIndex >= this.zoomSteps.length) {
            this.zoomIndex = this.zoomSteps.length - 1;
        }
        this.scrollDisplacementX *= (this.zoom() - 1);
        this.scrollDisplacementY *= (this.zoom() - 1);
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.drawAllTracksGraphics();
    }
    public moveWindow(directionX: number, directionY: number) {
        // when we haven't zoomed in, there is no need to move anything
        if (this.zoom() <= 1) {
            return;
        }
        // Get the first one, just to take the size
        let svgBoxId = this.svgBoxIdPrefix + '0';
        let svgBox = document.getElementById(svgBoxId);
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        let initialScrollDisplacementX = this.scrollDisplacementX;
        let initialScrollDisplacementY = this.scrollDisplacementY;
        if (directionX !== 0) {
            let fullWidth: number = this.zoom() * svgBoxWidth;
            let distanceToMove = svgBoxWidth * this.moveStep * directionX;
            if (this.scrollDisplacementX + distanceToMove < 0) {
                this.scrollDisplacementX = 0;
            } else if (this.scrollDisplacementX + distanceToMove + svgBoxWidth > fullWidth) {
                this.scrollDisplacementX = fullWidth - svgBoxWidth;
            } else {
                this.scrollDisplacementX += distanceToMove;
            }
        }
        if (directionY !== 0) {
            let fullHeight: number = this.zoom() * svgBoxHeight;
            let distanceToMove = svgBoxHeight * this.moveStep * directionY;
            if (this.scrollDisplacementY + distanceToMove < 0) {
                this.scrollDisplacementY = 0;
            } else if (this.scrollDisplacementY + distanceToMove + svgBoxHeight > fullHeight) {
                this.scrollDisplacementY = fullHeight - svgBoxHeight;
            } else {
                this.scrollDisplacementY += distanceToMove;
            }
        }
        if (initialScrollDisplacementX !== this.scrollDisplacementX ||
            initialScrollDisplacementY !== this.scrollDisplacementY) {
            this.drawAllTracksGraphics();
        }
    }
    public drawAllTracksGraphics() {
        for (let i = 0; i < this.song.notesTracks.length; i++) {
            this.drawTrackGraphic(i);
        }
    }
    public drawTrackGraphic(trackNumber: number) {
        let svgBoxId = this.svgBoxIdPrefix + trackNumber;
        let progressBarId = this.progressBarIdPrefix + trackNumber;
        this._svgBoxService.drawTrackGraphic(trackNumber, svgBoxId, this.song, this.zoom(),
            this.scrollDisplacementX, this.scrollDisplacementY, this.songIsPlaying, progressBarId);
    }

    public createProgressBar(progress: number) {
        for (let i = 0; i < this.song.notesTracks.length; i++) {
            try {
                let progressBarId = this.progressBarIdPrefix + i;
                let progressBar = document.getElementById(progressBarId);
                let svgBoxId = this.svgBoxIdPrefix + i;
                let svgBox = document.getElementById(svgBoxId);
                let svgBoxWidth = svgBox.clientWidth;
                let x = progress * svgBoxWidth;
                let actualx: number = x * this.zoom() - this.scrollDisplacementX;
                if (!progressBar) {
                    progressBar = this._svgBoxService.createProgressBar(0, svgBoxId, progressBarId);
                }
                if (actualx > 0 && actualx < svgBoxWidth) {
                    progressBar.setAttributeNS(null, 'x1', actualx.toString());
                    progressBar.setAttributeNS(null, 'x2', actualx.toString());
                    progressBar.setAttributeNS(null, 'visibility', 'visible');
                } else {
                    progressBar.setAttributeNS(null, 'visibility', 'hidden');
                }

            } catch (error) {
                console.log('An exception was raised at SongDisplayService.updateProgress()');
                console.log(error);
            }
        }
    }
    public songStarted(startPositionInTicks: number) {
        this.songIsPlaying = true;
        this.createProgressBar(0);
    }
    public songPausedorStopped() {
        this.songIsPlaying = false;
        this.drawAllTracksGraphics();
    }

   

    public updateProgress(elapsedTimeInSeconds: number) {
        let totalDuration = this.song.durationInSeconds * (1 - this.sliderPositionAtStart);
        if (totalDuration === 0) { // check to avoid a division by 0
            console.log('Unexpected song progress event because the total duration of the part of the song to play is 0');
            return;
        }
        let progress = elapsedTimeInSeconds / totalDuration + this.sliderPositionAtStart;
        this.createProgressBar(progress);
    }
}
