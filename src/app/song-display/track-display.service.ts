import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json';
import { TrackNote } from '../midi/track-note';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';

declare var MIDIjs: any;

@Injectable()
export class TrackDisplayService {
    song: SongJson;
    subscriptionAudioEvents: Subscription;
    songIsPlaying: boolean;
    svgns: string = 'http://www.w3.org/2000/svg';
    zoomIndex: number;  // is the index inside the zoomSteps array
    zoomSteps: number[] = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
    scrollDisplacementX: number; // when the user has zoomed in, and only part of the image is
    // shown, scrollDisplacement is the length from the left border
    // shown to the beginning of the song (outside the image)
    scrollDisplacementY: number;
    colorMusicBar: string = 'rgb(200,180,170)';
    colorProgressBar: string = 'rgb(200,0,0)';
    noteDotRadio: number = 1;
    trackIsMuted: boolean;
    svgBoxIdPrefix = 'svgBox';
    progressBarIdPrefix = 'progressBar';

    constructor() {
    }

    public initialize(song: SongJson, trackNotesNumber: number) {
        this.song = song;
        this.zoomIndex = 0;
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.songIsPlaying = false;
    }

    // ------------------------------------------------------------------------------
    // Utilities for drawing
    public createProgressBar(x = 0, trackNotesNumber: number): any {
        let progressBarId = this.progressBarIdPrefix + trackNotesNumber;
        let progressBar = document.getElementById(progressBarId);
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        if (progressBar) {
            try {
                svgBox.removeChild(progressBar);
            } catch (error) {
                console.log('The progressBar object is not null, but when trying to remove it an exception was raised');
                console.log(error);
            }
        }
        return this.createLine(x, x, 0, svgBox.clientHeight, 2,
            this.colorProgressBar, progressBarId, svgBox);
    }
    private createLine(x1: number, x2: number, y1: number, y2: number, width: number,
        color: string, id: string, svgBox: any): any {
        let line: any = document.createElementNS(this.svgns, 'line');
        line.setAttributeNS(null, 'width', width);
        line.setAttributeNS(null, 'x1', x1);
        line.setAttributeNS(null, 'x2', x2);
        line.setAttributeNS(null, 'y1', y1);
        line.setAttributeNS(null, 'y2', y2);
        line.setAttributeNS(null, 'style', 'stroke:' + color);
        if (id) {
            line.setAttributeNS(null, 'id', id);
        }
        svgBox.appendChild(line);
        return line;
    }
    // returns a reference to the dot created
    private createDot(x: number, y: number, r: number, color: string, svgBoxId: string): any {
        let svgBox = document.getElementById(svgBoxId);
        let dot: any = document.createElementNS(this.svgns, 'circle');
        dot.setAttributeNS(null, 'cx', x);
        dot.setAttributeNS(null, 'cy', y);
        dot.setAttributeNS(null, 'r', r);
        dot.setAttributeNS(null, 'fill', color);
        svgBox.appendChild(dot);
        return dot;
    }

    // Draws everything in the svg box, given the zoom value and x/y discplacements
    public drawGraphic(trackNotesNumber: number) {
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        this.cleanSvg(trackNotesNumber);
        let horizontalScale: number = svgBoxWidth / this.song.durationInTicks;
        horizontalScale = horizontalScale * this.zoom();

        let thisTrack = this.song.notesTracks[trackNotesNumber];
        let verticalScale: number = svgBoxHeight / (thisTrack.range.maxPitch - thisTrack.range.minPitch);
        verticalScale = verticalScale * this.zoom();
        let noteSeq: TrackNote[] = thisTrack.notesSequence;



        // Create a dot for each note in the track
        for (let m = 0; m < noteSeq.length; m++) {
            let note: TrackNote = noteSeq[m];
            let cx: number = note.ticksFromStart * horizontalScale;
            let cy: number;
            if (thisTrack.range.maxPitch > thisTrack.range.minPitch) {
                cy = svgBoxHeight - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
            } else {
                cy = svgBoxHeight / 2;
            }
            if (cx - this.scrollDisplacementX < svgBoxWidth &&
                cx - this.scrollDisplacementX > 0 &&
                cy - this.scrollDisplacementY < svgBoxHeight &&
                cy - this.scrollDisplacementY > 0) {
                this.createDot(cx - this.scrollDisplacementX, cy - this.scrollDisplacementY,
                    this.noteDotRadio, 'black', svgBoxId)
            }
        }
        this.createStaffBars(horizontalScale, trackNotesNumber);
        if (this.songIsPlaying) {
            this.createProgressBar(0, trackNotesNumber);
        }
    }
    private createStaffBars(horizontalScale: number, trackNotesNumber: number) {
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        let barx = 0;
        while (barx < svgBoxWidth) {
            this.createLine(barx, barx, 0, svgBoxHeight, 1, this.colorMusicBar, '',
                svgBox)
            barx += this.song.getTicksPerBar() * horizontalScale;
        }
    }

    // Cleans the graphic and the information svg boxes
    private cleanSvg(trackNotesNumber: number) {
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        let parentElement = svgBox.parentElement;
        let emptySvg = svgBox.cloneNode(false);
        parentElement.removeChild(svgBox);
        parentElement.appendChild(emptySvg);
        svgBox = document.getElementById(svgBoxId);
    }
    // ----------------------------------------------------------------------------------

    private zoom() {
        return this.zoomSteps[this.zoomIndex];
    }
    // ------------------------------------------------------------------------------
    // Responses to events
    // ------------------------------------------------------------------------------
    // stepSign is +1 for zoom in and -1 for zoom out
    public changeZoom(stepSign: number, trackNotesNumber: number) {
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

        this.drawGraphic(trackNotesNumber);
    }
    public moveWindow(directionX: number, directionY: number, trackNotesNumber: number) {
        // when we haven't zoomed in, there is no need to move anything
        if (this.zoom() <= 1) {
            return;
        }
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        let initialScrollDisplacementX = this.scrollDisplacementX;
        let initialScrollDisplacementY = this.scrollDisplacementY;
        if (directionX !== 0) {
            let fullWidth: number = this.zoom() * svgBoxWidth;
            let distanceToMove = svgBoxWidth * 0.7 * directionX;
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
            let distanceToMove = svgBoxHeight * directionY * this.zoom();
            if (this.scrollDisplacementY + distanceToMove < 0) {
                this.scrollDisplacementY = 0;
            } else if (this.scrollDisplacementY + distanceToMove > fullHeight) {
                this.scrollDisplacementY = fullHeight - svgBoxHeight;
            } else {
                this.scrollDisplacementY += distanceToMove;
            }
        }
        if (initialScrollDisplacementX !== this.scrollDisplacementX ||
            initialScrollDisplacementY !== this.scrollDisplacementY) {
            this.drawGraphic(trackNotesNumber);
        }
    }
    public songStarted(startPositionInTicks: number, trackNotesNumber: number) {
        this.songIsPlaying = true;
        this.createProgressBar(0, trackNotesNumber);
    }
    public songPaused(trackNotesNumber: number) {
        let progressBarId = this.progressBarIdPrefix + trackNotesNumber;
        let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
        let svgBox = document.getElementById(svgBoxId);
        this.songIsPlaying = false;
        try {
            let progressBar = document.getElementById(progressBarId);
            if (progressBar) {
                svgBox.removeChild(progressBar);
            }
        } catch (error) {
            console.log('An exception was raised at SongDisplayService.songPaused()');
            console.log(error);
        }
    }
    public songStopped(trackNotesNumber: number) {
        this.songIsPlaying = false;
        this.removeProgressBar(trackNotesNumber);
    }

    private removeProgressBar(trackNotesNumber: number) {
        try {
            let progressBarId = this.progressBarIdPrefix + trackNotesNumber;
            let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
            let svgBox = document.getElementById(svgBoxId);
            let progressBar = document.getElementById(progressBarId);
            if (progressBar) {
                svgBox.removeChild(progressBar);
            }
        } catch (error) {
            console.log('An exception was raised at SongDisplayService.songStopped()');
            console.log(error);
        }
    }
    public updateProgress(x: number, trackNotesNumber: number) {
        if (!this.songIsPlaying) {
            return;
        }
        try {
            let progressBarId = this.progressBarIdPrefix + trackNotesNumber;
            let progressBar = document.getElementById(progressBarId);
            let svgBoxId = this.svgBoxIdPrefix + trackNotesNumber;
            let svgBox = document.getElementById(svgBoxId);
            let svgBoxWidth = svgBox.clientWidth;
            let actualx: number = x * this.zoom() - this.scrollDisplacementX;
            if (!progressBar) {
                progressBar = this.createProgressBar(0, trackNotesNumber);
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
