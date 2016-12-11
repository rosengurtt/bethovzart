import { Injectable } from '@angular/core';
import { trackNote } from '../midi/track-note';
import { notesTrack } from '../midi/notes-track';
import { trackRange } from '../midi/track-range';
import { songJson } from '../midi/song-json';
import { midiEvent } from '../midi/midi-event';


@Injectable()
export class SongDisplayService {
    song: songJson;
    songIsPlaying: boolean;
    noTracksWithNotes: number = 0;
    svgSongDisplayBox: any;
    svgns: string = 'http://www.w3.org/2000/svg';
    svgBoxWidth: number;
    svgBoxHeight: number;
    informationSectionWidth: number = 90;
    graphicSectionWidth: number;  // The width of the area where we show note dots
    separationBetweenTracks: number;
    trackHeight: number;
    progressBar: any;
    timer: any;
    timeStarted: number;
    zoomIndex: number;  // is the index inside zoomSteps
    zoomSteps: number[] = [1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
    scrollDisplacementX: number; // when the user has zoomed in, and only part of the image is
    // shown, scrollDisplacement is the length from the left border
    // shown to the beginnin of the song (outside the image)
    scrollDisplacementY: number;
    colorTrackSeparator: string = 'rgb(200,180,170)';
    colorProgressBar: string = 'rgb(200,0,0)';
    noteDotRadio: number = 1;

    constructor() {
    }


    public async songDisplay(songData: songJson) {
        this.song = songData;
        this.Initialize();
        let noTracks = this.song.notesTracks.length;
        for (let t = 0; t < noTracks; t++) {
            if (this.song.notesTracks[t].notesSequence.length > 0) {
                this.noTracksWithNotes++;
            }
        }
        this.svgBoxWidth = this.svgSongDisplayBox.clientWidth;
        this.svgBoxHeight = this.trackHeight * this.noTracksWithNotes;
        if (this.svgBoxHeight > 600) {
            this.svgBoxHeight = 600;
        }
        let heightText: string = this.svgBoxHeight + 'px';
        this.svgSongDisplayBox.setAttribute('height', heightText);
        this.trackHeight = (this.svgBoxHeight - (this.separationBetweenTracks * (this.noTracksWithNotes - 1))) / this.noTracksWithNotes;
        this.Draw();
    }
    private Initialize() {
        this.svgSongDisplayBox = document.getElementById('svgBox');
        this.trackHeight = 150; // Default
        this.separationBetweenTracks = 6;
        this.noTracksWithNotes = 0;
        this.zoomIndex = 0;
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.songIsPlaying = false;
        this.svgBoxUsableWidth = this.svgBoxWidth - this.informationSectionWidth;
    }

    //------------------------------------------------------------------------------
    // Responses to events
    //------------------------------------------------------------------------------
    // stepSign is +1 for zoom in and -1 for zoom out
    public changeZoom(stepSign: number) {
        // if invalid parameter do nothing
        if (stepSign !== 1 && stepSign !== -1) {
            return;
        }
        this.zoomIndex += stepSign;
        if (this.zoomIndex < 0) {
            this.zoomIndex = 0;
        }
        else if (this.zoomIndex >= this.zoomSteps.length) {
            this.zoomIndex = this.zoomSteps.length - 1;
        }
        this.scrollDisplacementX *= (this.zoom() - 1);
        this.scrollDisplacementY *= (this.zoom() - 1);

        this.Draw();
    }
    public moveWindow(directionX: number, directionY: number) {
        // when we haven't zoomed in, there is no need to move anything
        if (this.zoom() <= 1) {
            return;
        }
        let initialScrollDisplacementX = this.scrollDisplacementX;
        let initialScrollDisplacementY = this.scrollDisplacementY;
        if (directionX !== 0) {
            let fullWidth: number = this.zoom() * this.svgBoxWidth;
            let distanceToMove = this.svgBoxWidth * 0.7 * directionX;
            if (this.scrollDisplacementX + distanceToMove < 0) {
                this.scrollDisplacementX = 0;
            }
            else if (this.scrollDisplacementX + distanceToMove + this.svgBoxWidth > fullWidth) {
                this.scrollDisplacementX = fullWidth - this.svgBoxWidth;
            }
            else {
                this.scrollDisplacementX += distanceToMove;
            }
        }
        if (directionY !== 0) {
            let fullHeight: number = this.zoom() * this.svgBoxHeight;
            let distanceToMove = (this.trackHeight + this.separationBetweenTracks) * directionY * this.zoom();
            if (this.scrollDisplacementY + distanceToMove < 0) {
                this.scrollDisplacementY = 0;
            }
            else if (this.scrollDisplacementY + distanceToMove > fullHeight) {
                this.scrollDisplacementY = fullHeight - this.svgBoxHeight;
            }
            else {
                this.scrollDisplacementY += distanceToMove;
            }
        }
        if (initialScrollDisplacementX !== this.scrollDisplacementX ||
            initialScrollDisplacementY !== this.scrollDisplacementY) {
            this.Draw();
        }
    }
    public songStarted() {
        this.songIsPlaying = true;
        this.CreateProgressBar();
    }
    public songPaused() {
        this.songIsPlaying = false;
        if (document.getElementById('progressBar')) {
            this.svgSongDisplayBox.removeChild(this.progressBar);
        }
    }
    public songStopped() {
        this.songIsPlaying = true;
        if (document.getElementById('progressBar')) {
            this.svgSongDisplayBox.removeChild(this.progressBar);
        }
    }
    public UpdateProgress(x: number) {
        let actualx: number = x * this.zoom() - this.scrollDisplacementX;
        if (actualx > 0 && actualx < this.svgBoxWidth) {
            this.progressBar.setAttributeNS(null, 'x1', actualx);
            this.progressBar.setAttributeNS(null, 'x2', actualx);
            this.progressBar.setAttributeNS(null, 'visibility', 'visible');
        }
        else {
            this.progressBar.setAttributeNS(null, 'visibility', 'hidden');
        }
    }

    //------------------------------------------------------------------------------
    // Utilities for drawing
    public CreateProgressBar(x = 0) {
        this.progressBar = this.CreateLine(x, x, 0, this.svgBoxHeight, 2,
            this.colorProgressBar, 'progressBar');
    }
    private CreateLine(x1: number, x2: number, y1: number, y2: number, width: number,
        color: string, id: string): any {
        let line: any = document.createElementNS(this.svgns, 'line');
        line.setAttributeNS(null, 'width', width);
        line.setAttributeNS(null, 'x1', x1);
        line.setAttributeNS(null, 'x2', x2);
        line.setAttributeNS(null, 'y1', y1);
        line.setAttributeNS(null, 'y2', y2);
        line.setAttributeNS(null, 'style', 'stroke:' + color);
        line.setAttributeNS(null, 'id', id);
        this.svgSongDisplayBox.appendChild(line);
        return line;
    }
    private CreateDot(x: number, y: number, r: number, color: string): any {
        let dot: any = document.createElementNS(this.svgns, 'circle');
        dot.setAttributeNS(null, 'cx', x);
        dot.setAttributeNS(null, 'cy', y);
        dot.setAttributeNS(null, 'r', r);
        dot.setAttributeNS(null, 'fill', color);
        this.svgSongDisplayBox.appendChild(dot);
        return dot;
    }

    // Draws everything in the svg box, given the zoom value and x/y discplacements
    private Draw() {
        this.CleanSvg();
        let i = -1; // this index corresponds to tracks shown (we show only tracks with notes)
        for (let n = 0; n < this.song.notesTracks.length; n++) {
            // ignore tracks with no notes
            if (this.song.notesTracks[n].notesSequence.length === 0) {
                continue;
            }
            i++;
            let thisTrack = this.song.notesTracks[n];
            let verticalScale: number = this.trackHeight / (thisTrack.range.maxPitch - thisTrack.range.minPitch);
            verticalScale = verticalScale * this.zoom();
            let horizontalScale: number = this.svgBoxWidth / this.song.durationInTicks;
            horizontalScale = horizontalScale * this.zoom();
            let verticalShift: number = ((i + 1) * (this.trackHeight)) + (i * this.separationBetweenTracks);
            verticalShift = verticalShift * this.zoom();
            let noteSeq: trackNote[] = thisTrack.notesSequence;

            // Add a line separating the tracks
            let heightOfSeparator = verticalShift + this.separationBetweenTracks / 2;
            if (heightOfSeparator < this.svgBoxHeight) {
                this.CreateLine(0, this.svgBoxWidth, heightOfSeparator, heightOfSeparator, 1,
                    this.colorTrackSeparator, 'separator' + n);
            }

            // Create a dot for each note in the track
            for (let m = 0; m < noteSeq.length; m++) {
                let note: trackNote = noteSeq[m];
                let cx: number = note.ticksFromStart * horizontalScale;
                let cy: number;
                if (thisTrack.range.maxPitch > thisTrack.range.minPitch) {
                    cy = verticalShift - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
                }
                else {
                    cy = verticalShift / 2;
                }
                if (cx - this.scrollDisplacementX < this.svgBoxWidth &&
                    cx - this.scrollDisplacementX > 0 &&
                    cy - this.scrollDisplacementY < this.svgBoxHeight &&
                    cy - this.scrollDisplacementY > 0) {
                    this.CreateDot(cx - this.scrollDisplacementX, cy - this.scrollDisplacementY,
                        this.noteDotRadio, 'black')
                }
            }
        }
        if (this.songIsPlaying) {
            this.CreateProgressBar();
        }
    }
    // Removes everything from the svg box
    private CleanSvg() {
        let parentElement = this.svgSongDisplayBox.parentElement;
        let emptySvg = this.svgSongDisplayBox.cloneNode(false);
        parentElement.removeChild(this.svgSongDisplayBox);
        parentElement.appendChild(emptySvg);
        this.svgSongDisplayBox = document.getElementById('svgBox');
    }
    //----------------------------------------------------------------------------------

    private zoom() {
        return this.zoomSteps[this.zoomIndex];
    }
}