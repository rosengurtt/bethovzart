import { Injectable } from '@angular/core';
import { TrackNote } from '../midi/track-note';
import { SongJson } from '../midi/song-json';
import { Instrument } from '../midi/midi-codes/instrument.enum';

@Injectable()
export class SongDisplayService {
    song: SongJson;
    songIsPlaying: boolean;
    noTracksWithNotes: number = 0;
    svgns: string = 'http://www.w3.org/2000/svg';
    staffAreaBox: any;  // html svg element where the music is shown graphically
    staffAreaWidth: number;
    staffAreaHeight: number;
    informationAreaBox: any; // html svg element of the box showing track info
    informationAreaWidth: number;
    separationBetweenTracks: number; // separation in pixels
    trackHeight: number;
    progressBarId = 'progressBar';
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

    mutedTracks: number[];

    constructor() {
    }


    public async songDisplay(songData: SongJson) {
        this.song = songData;
        this.initialize();
        let noTracks = this.song.notesTracks.length;
        for (let t = 0; t < noTracks; t++) {
            if (this.song.notesTracks[t].notesSequence.length > 0) {
                this.noTracksWithNotes++;
            }
        }
        this.staffAreaWidth = this.staffAreaBox.clientWidth;
        this.staffAreaHeight = this.trackHeight * this.noTracksWithNotes;
        this.informationAreaWidth = this.informationAreaBox.clientWidth;
        if (this.staffAreaHeight > 600) {
            this.staffAreaHeight = 600;
        }
        let heightText: string = this.staffAreaHeight + 'px';
        this.staffAreaBox.setAttribute('height', heightText);
        this.informationAreaBox.setAttribute('height', heightText);
        this.trackHeight = (this.staffAreaHeight - (this.separationBetweenTracks * (this.noTracksWithNotes - 1))) / this.noTracksWithNotes;
        this.drawGraphic();
    }
    private initialize() {
        this.staffAreaBox = document.getElementById('svgBoxStaffArea');
        this.informationAreaBox = document.getElementById('svgBoxInformationArea');
        this.trackHeight = 150; // Default, can be reduced if no of tracks is high
        this.separationBetweenTracks = 6;
        this.noTracksWithNotes = 0;
        this.zoomIndex = 0;
        this.scrollDisplacementX = 0;
        this.scrollDisplacementY = 0;
        this.songIsPlaying = false;
        this.mutedTracks = [];
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
            let fullHeight: number = this.zoom() * this.staffAreaHeight;
            let distanceToMove = (this.trackHeight + this.separationBetweenTracks) * directionY * this.zoom();
            if (this.scrollDisplacementY + distanceToMove < 0) {
                this.scrollDisplacementY = 0;
            } else if (this.scrollDisplacementY + distanceToMove > fullHeight) {
                this.scrollDisplacementY = fullHeight - this.staffAreaHeight;
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

    // this functionality is in progress. At the moment, when the information area
    // is clicked, the corresponding track is muted
    // in the future it will show a context menu that will allow other things
    public informationAreaClicked(x: number, y: number) {
        let trackClicked = Math.floor(y / (this.trackHeight + this.separationBetweenTracks));
        let index = this.mutedTracks.indexOf(trackClicked);
        if (index > -1) {
            this.mutedTracks.splice(index, 1);
        } else {
            this.mutedTracks.push(trackClicked);
        }
        console.log(this.mutedTracks);
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
        return this.createLine(x, x, 0, this.staffAreaHeight, 2,
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
        this.informationAreaBox.appendChild(text);
        return text;
    }
    private addIcon(filePath: string, x: number, y: number) {
        let use: any = document.createElementNS(this.svgns, 'use');
        use.setAttributeNS(null, 'x', x);
        use.setAttributeNS(null, 'y', y);
        use.setAttributeNS('http://www.w3.org/2000/svg', 'xlink:href', filePath);
        this.informationAreaBox.appendChild(use);
        return use;
    }


    // Draws everything in the svg box, given the zoom value and x/y discplacements
    private drawGraphic() {
        this.cleanSvg();
        let horizontalScale: number = this.staffAreaWidth / this.song.durationInTicks;
        horizontalScale = horizontalScale * this.zoom();
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
            let verticalShift: number = ((i + 1) * (this.trackHeight)) + (i * this.separationBetweenTracks);
            verticalShift = verticalShift * this.zoom();
            let noteSeq: TrackNote[] = thisTrack.notesSequence;

            // Populate information section
            let heightOfSeparator = verticalShift + this.separationBetweenTracks / 2;
            this.createLine(0, this.informationAreaWidth, heightOfSeparator, heightOfSeparator, 1,
                this.colorTrackSeparator, '', this.informationAreaBox);
            let trackInfo: string = this.song.notesTracks[n].trackName;

            trackInfo += ' - ' + Instrument[this.song.notesTracks[n].instrument];

            this.createText(trackInfo, 5, heightOfSeparator - this.trackHeight + 6,
                'font-family:"Verdana";font-size:10')

            this.addIcon('./app/assets/svg/Mute_Icon.svg:#muteicon', 10, 10);

            // Add a line separating the tracks
            if (heightOfSeparator < this.staffAreaHeight) {
                this.createLine(0, this.staffAreaWidth, heightOfSeparator, heightOfSeparator, 1,
                    this.colorTrackSeparator, '', this.staffAreaBox);
            }

            // Create a dot for each note in the track
            for (let m = 0; m < noteSeq.length; m++) {
                let note: TrackNote = noteSeq[m];
                let cx: number = note.ticksFromStart * horizontalScale;
                let cy: number;
                if (thisTrack.range.maxPitch > thisTrack.range.minPitch) {
                    cy = verticalShift - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
                } else {
                    cy = verticalShift / 2;
                }
                if (cx - this.scrollDisplacementX < this.staffAreaWidth &&
                    cx - this.scrollDisplacementX > 0 &&
                    cy - this.scrollDisplacementY < this.staffAreaHeight &&
                    cy - this.scrollDisplacementY > 0) {
                    this.createDot(cx - this.scrollDisplacementX, cy - this.scrollDisplacementY,
                        this.noteDotRadio, 'black')
                }
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
            this.createLine(barx, barx, 0, this.staffAreaHeight, 1, this.colorMusicBar, '',
                this.staffAreaBox)
            barx += this.song.getTicksPerBar() * horizontalScale;
        }
    }


    // Removes everything from a svg box
    private cleanSvgBox(box: any, boxName: string) {
        let parentElement = box.parentElement;
        let emptySvg = box.cloneNode(false);
        parentElement.removeChild(box);
        parentElement.appendChild(emptySvg);
        if (boxName === 'svgBoxStaffArea') {
            this.staffAreaBox = document.getElementById(boxName);
        } else if (boxName === 'svgBoxInformationArea') {
            this.informationAreaBox = document.getElementById(boxName);
        }
    }

    // Cleans the graphic and the information svg boxes
    private cleanSvg() {
        this.cleanSvgBox(this.staffAreaBox, 'svgBoxStaffArea')
        this.cleanSvgBox(this.informationAreaBox, 'svgBoxInformationArea')
    }
    // ----------------------------------------------------------------------------------

    private zoom() {
        return this.zoomSteps[this.zoomIndex];
    }
    // ----------------------------------------------------------------------------------
    // Functions called from other services
    public getMutedTracks(): number[] {
        return this.mutedTracks;
    }
}