import { Component, Input, AfterViewChecked, OnChanges, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { Band } from './band';
import { SongDisplayService } from '../graphics/song-display.service';
import { AudioControlsService } from '../graphics/audio-controls.service'
import { Binary2base64 } from '../shared/binary-to-base64';
import { MidiFileCheckerService } from '../midi/midi-file-checker.service';
import { TrackNote } from '../midi/track-note';
import { Instrument } from '../midi/midi-codes/instrument.enum';
import { PlayControlsEventsService } from '../graphics/play-controls-events.service';
import { PlayControlEvents } from '../graphics/play-controls-events.enum';

declare var MIDIjs: any;

@Component({
    selector: 'track-display',
    templateUrl: './track-display.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class TrackDisplayComponent implements OnChanges, AfterViewChecked, OnInit {
    @Input() song: SongJson;
    @Input() trackNumber: number;
    subscriptionPlayEvents: Subscription;
    songIsPlaying: boolean;
    svgns: string = 'http://www.w3.org/2000/svg';
    staffAreaBox: any;  // html svg element where the music is shown graphically
    staffAreaWidth: number;
    trackHeight: number = 150; // height in pixels. When there are many tracks, we may want to reduce it
    staffAreaBoxId: string;
    progressBarId = 'progressBar' + this.trackNumber;
    zoomIndex: number;  // is the index inside the zoomSteps array
    zoomSteps: number[] = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
    scrollDisplacementX: number; // when the user has zoomed in, and only part of the image is
    // shown, scrollDisplacement is the length from the left border
    // shown to the beginning of the song (outside the image)
    scrollDisplacementY: number;
    colorTrackSeparator: string = 'rgb(200,180,170)';
    colorMusicBar: string = 'rgb(200,180,170)';
    colorProgressBar: string = 'rgb(200,0,0)';
    noteDotRadio: number = 1;
    trackInfo: string;

    constructor(private _songService: SongRepositoryService,
        private _midi2JsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService,
        private _audioControlsService: AudioControlsService,
        private _midiFileCheckerService: MidiFileCheckerService,
        private _playControlsEventsService: PlayControlsEventsService) {
        this.subscriptionPlayEvents = this._playControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event)
            });
    }

    async ngOnChanges() {

    }

    private handleEvent(event: PlayControlEvents) {
        switch (event) {
            case PlayControlEvents.play: break;
            case PlayControlEvents.stop: break;
            case PlayControlEvents.pause: break;
            case PlayControlEvents.goToBeginning: break;
            case PlayControlEvents.goToEnd: break;
            case PlayControlEvents.zoomIn: break;
            case PlayControlEvents.zoomOut: break;
            case PlayControlEvents.moveUp: break;
            case PlayControlEvents.moveDown: break;
            case PlayControlEvents.moveLeft: break;
            case PlayControlEvents.moveRight: break;
        }
    }

    ngOnInit() {
        // Populate information section
        this.trackInfo = this.song.notesTracks[this.trackNumber].trackName;
        this.trackInfo += ' - ' + Instrument[this.song.notesTracks[this.trackNumber].instrument];
    }

    ngAfterViewChecked() {
        this.initialize();
        this.drawGraphic();
    }
    private initialize() {
        this.staffAreaBoxId = 'svgBoxStaffArea' + this.trackNumber;
        this.staffAreaBox = document.getElementById(this.staffAreaBoxId);
        this.zoomIndex = 0;
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.songIsPlaying = false;
        this.staffAreaWidth = this.staffAreaBox.clientWidth;
        let heightText: string = this.trackHeight + 'px';
        this.staffAreaBox.setAttribute('height', heightText);
    }

    // ------------------------------------------------------------------------------
    // Utilities for drawing
    public createProgressBar(x = 0): any {
        let progressBar = document.getElementById('svgBoxStaffArea');
        if (progressBar) {
            try {
                this.staffAreaBox.removeChild(progressBar);
            } catch (error) {
                console.log('The progressBar object is not null, but when trying to remove it an exception was raised');
                console.log(error);
            }
        }
        return this.createLine(x, x, 0, this.trackHeight, 2,
            this.colorProgressBar, 'progressBar');
    }
    private createLine(x1: number, x2: number, y1: number, y2: number, width: number,
        color: string, id: string, control: any = this.staffAreaBox): any {
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
        control.appendChild(line);
        return line;
    }
    // returns a reference to the dot created
    private createDot(x: number, y: number, r: number, color: string): any {
        let dot: any = document.createElementNS(this.svgns, 'circle');
        dot.setAttributeNS(null, 'cx', x);
        dot.setAttributeNS(null, 'cy', y);
        dot.setAttributeNS(null, 'r', r);
        dot.setAttributeNS(null, 'fill', color);
        this.staffAreaBox.appendChild(dot);
        return dot;
    }

    // returns a reference to the text element created
    private createText(inputText: string, x: number, y: number, style: string): any {
        let text: any = document.createElementNS(this.svgns, 'text');
        text.innerHTML = inputText;
        text.setAttributeNS(null, 'x', x);
        text.setAttributeNS(null, 'y', y);
        text.setAttributeNS(null, 'style', style);
        return text;
    }



    // Draws everything in the svg box, given the zoom value and x/y discplacements
    private drawGraphic() {
        this.cleanSvg();
        let horizontalScale: number = this.staffAreaWidth / this.song.durationInTicks;
        horizontalScale = horizontalScale * this.zoom();

        let thisTrack = this.song.notesTracks[this.trackNumber];
        let verticalScale: number = this.trackHeight / (thisTrack.range.maxPitch - thisTrack.range.minPitch);
        verticalScale = verticalScale * this.zoom();
        let noteSeq: TrackNote[] = thisTrack.notesSequence;



        // Create a dot for each note in the track
        for (let m = 0; m < noteSeq.length; m++) {
            let note: TrackNote = noteSeq[m];
            let cx: number = note.ticksFromStart * horizontalScale;
            let cy: number;
            if (thisTrack.range.maxPitch > thisTrack.range.minPitch) {
                cy = this.trackHeight - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
            } else {
                cy = this.trackHeight / 2;
            }
            if (cx - this.scrollDisplacementX < this.staffAreaWidth &&
                cx - this.scrollDisplacementX > 0 &&
                cy - this.scrollDisplacementY < this.trackHeight &&
                cy - this.scrollDisplacementY > 0) {
                this.createDot(cx - this.scrollDisplacementX, cy - this.scrollDisplacementY,
                    this.noteDotRadio, 'black')
            }
        }
        this.createStaffBars(horizontalScale);
        if (this.songIsPlaying) {
            this.createProgressBar();
        }
    }
    private createStaffBars(horizontalScale: number) {
        let barx = 0;
        while (barx < this.staffAreaWidth) {
            this.createLine(barx, barx, 0, this.trackHeight, 1, this.colorMusicBar, '',
                this.staffAreaBox)
            barx += this.song.getTicksPerBar() * horizontalScale;
        }
    }




    // Cleans the graphic and the information svg boxes
    private cleanSvg() {
        let parentElement = this.staffAreaBox.parentElement;
        let emptySvg = this.staffAreaBox.cloneNode(false);
        parentElement.removeChild(this.staffAreaBox);
        parentElement.appendChild(emptySvg);
        this.staffAreaBox = document.getElementById(this.staffAreaBoxId);
    }
    // ----------------------------------------------------------------------------------

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

        this.drawGraphic();
    }
    public moveWindow(directionX: number, directionY: number) {
        // when we haven't zoomed in, there is no need to move anything
        if (this.zoom() <= 1) {
            return;
        }
        let initialScrollDisplacementX = this.scrollDisplacementX;
        let initialScrollDisplacementY = this.scrollDisplacementY;
        if (directionX !== 0) {
            let fullWidth: number = this.zoom() * this.staffAreaWidth;
            let distanceToMove = this.staffAreaWidth * 0.7 * directionX;
            if (this.scrollDisplacementX + distanceToMove < 0) {
                this.scrollDisplacementX = 0;
            } else if (this.scrollDisplacementX + distanceToMove + this.staffAreaWidth > fullWidth) {
                this.scrollDisplacementX = fullWidth - this.staffAreaWidth;
            } else {
                this.scrollDisplacementX += distanceToMove;
            }
        }
        if (directionY !== 0) {
            let fullHeight: number = this.zoom() * this.trackHeight;
            let distanceToMove = this.trackHeight * directionY * this.zoom();
            if (this.scrollDisplacementY + distanceToMove < 0) {
                this.scrollDisplacementY = 0;
            } else if (this.scrollDisplacementY + distanceToMove > fullHeight) {
                this.scrollDisplacementY = fullHeight - this.trackHeight;
            } else {
                this.scrollDisplacementY += distanceToMove;
            }
        }
        if (initialScrollDisplacementX !== this.scrollDisplacementX ||
            initialScrollDisplacementY !== this.scrollDisplacementY) {
            this.drawGraphic();
        }
    }
    public songStarted(startPositionInTicks: number) {
        this.songIsPlaying = true;
        this.createProgressBar(startPositionInTicks);
    }
    public songPaused() {
        this.songIsPlaying = false;
        try {
            let progressBar = document.getElementById(this.progressBarId)
            if (progressBar) {
                this.staffAreaBox.removeChild(progressBar);
            }
        } catch (error) {
            console.log('An exception was raised at SongDisplayService.songPaused()');
            console.log(error);
        }
    }
    public songStopped() {
        this.songIsPlaying = false;
        this.removeProgressBar();
    }

    private removeProgressBar() {
        try {
            let progressBar = document.getElementById(this.progressBarId)
            if (progressBar) {
                this.staffAreaBox.removeChild(progressBar);
            }
        } catch (error) {
            console.log('An exception was raised at SongDisplayService.songStopped()');
            console.log(error);
        }
    }
    public updateProgress(x: number) {
        if (!this.songIsPlaying) {
            return;
        }
        try {
            let actualx: number = x * this.zoom() - this.scrollDisplacementX;
            let progressBar = document.getElementById(this.progressBarId);
            if (!progressBar) {
                progressBar = this.createProgressBar(0);
            }
            if (actualx > 0 && actualx < this.staffAreaWidth) {
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