import { Injectable } from '@angular/core';

import { SongJson } from '../midi/song-json/song-json';
import { TrackNote } from '../midi/track-note';

@Injectable()
export class SvgBoxService {
    svgns: string = 'http://www.w3.org/2000/svg';
    colorMusicBar: string = 'rgb(200,180,170)';
    colorProgressBar: string = 'rgb(200,0,0)';
    noteDotRadio: number = 1;

    public createProgressBar(svgBoxId: string, progressBarId: string, zoom: number,
        scrollDisplacementX: number, progress: number): any {
        let progressBar = document.getElementById(progressBarId);
        let svgBox = document.getElementById(svgBoxId);
        if (svgBox) {
            let svgBoxWidth = svgBox.clientWidth;
            let x = progress * svgBoxWidth;
            let actualx: number = x * zoom - scrollDisplacementX;
            this.deleteProgressBar(svgBoxId, progressBarId);
            if (actualx > 0 && actualx < svgBoxWidth) {
                progressBar = this.createLine(x, x, 0, svgBox.clientHeight, 2,
                    this.colorProgressBar, progressBarId, svgBox);
            }
        }
    }

    public deleteProgressBar(svgBoxId: string, progressBarId: string) {
        let progressBar = document.getElementById(progressBarId);
        let svgBox = document.getElementById(svgBoxId);
        if (progressBar) {
            try {
                svgBox.removeChild(progressBar);
            } catch (error) {
                console.log('The progressBar object is not null, but when trying to remove it an exception was raised');
                console.log(error);
            }
        }
    }

    public createLine(x1: number, x2: number, y1: number, y2: number, width: number,
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
    public createDot(x: number, y: number, r: number, color: string, svgBoxId: string): any {
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
    public drawTrackGraphic(trackNotesNumber: number, svgBoxId: string, song: SongJson, zoom: number,
        scrollDisplacementX: number, scrollDisplacementY: number, createProgressBar: boolean,
        progressBarId?: string): string {
        let svgBox = document.getElementById(svgBoxId);
        if (!svgBox) {
            return;
        }
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        this.cleanSvg(svgBoxId);
        let horizontalScale: number = svgBoxWidth / song.durationInTicks;
        horizontalScale = horizontalScale * zoom;

        let thisTrack = song.notesTracks[trackNotesNumber];
        let pitchSpaceLength = 128;
        let verticalScale: number = svgBoxHeight / pitchSpaceLength;
        verticalScale = verticalScale * zoom;
        let noteSeq: TrackNote[] = thisTrack.notesSequence;

        // Create a dot for each note in the track
        for (let m = 0; m < noteSeq.length; m++) {
            let note: TrackNote = noteSeq[m];
            let cx: number = note.ticksFromStart * horizontalScale;
            let cy: number;
            cy = svgBoxHeight - note.pitch * verticalScale + svgBoxHeight * (zoom - 1);
            if (cx - scrollDisplacementX < svgBoxWidth &&
                cx - scrollDisplacementX > 0 &&
                cy - scrollDisplacementY < svgBoxHeight &&
                cy - scrollDisplacementY > 0) {
                this.createDot(cx - scrollDisplacementX, cy - scrollDisplacementY,
                    this.noteDotRadio, 'black', svgBoxId)
            }
        }
        this.createStaffBars(horizontalScale, svgBoxId, song);
        if (createProgressBar) {
            return this.createProgressBar(svgBoxId, progressBarId, zoom, scrollDisplacementX, 0);
        } else {
            return null;
        }
    }


    public drawTracksCollapsedGraphic(svgBoxId: string, song: SongJson, zoom: number,
        scrollDisplacementX: number, scrollDisplacementY: number, createProgressBar: boolean,
        progressBarId?: string): string {

        let svgBox = document.getElementById(svgBoxId);
        if (!svgBox) {
            return;
        }
        let svgBoxWidth = svgBox.clientWidth;
        let svgBoxHeight = svgBox.clientHeight;
        this.cleanSvg(svgBoxId);
        let horizontalScale: number = svgBoxWidth / song.durationInTicks;
        horizontalScale = horizontalScale * zoom;

        let pitchSpaceLength = 128;
        let verticalScale: number = svgBoxHeight / pitchSpaceLength;
        verticalScale = verticalScale * zoom;
        for (let i = 0; i < song.notesTracks.length; i++) {
            let thisTrack = song.notesTracks[i];
            let noteSeq: TrackNote[] = thisTrack.notesSequence;

            // Create a dot for each note in the track
            for (let m = 0; m < noteSeq.length; m++) {
                let note: TrackNote = noteSeq[m];
                let cx: number = note.ticksFromStart * horizontalScale;
                let cy: number;
                cy = svgBoxHeight - note.pitch * verticalScale + svgBoxHeight * (zoom - 1);
                if (cx - scrollDisplacementX < svgBoxWidth &&
                    cx - scrollDisplacementX > 0 &&
                    cy - scrollDisplacementY < svgBoxHeight &&
                    cy - scrollDisplacementY > 0) {
                    this.createDot(cx - scrollDisplacementX, cy - scrollDisplacementY,
                        this.noteDotRadio, 'black', svgBoxId)
                }
            }
        }
        this.createStaffBars(horizontalScale, svgBoxId, song);
        if (createProgressBar) {
            return this.createProgressBar(svgBoxId, progressBarId, zoom, scrollDisplacementX, 0);
        } else {
            return null;
        }
    }
    private createStaffBars(horizontalScale: number, svgBoxId: string, song: SongJson) {
        let svgBox = document.getElementById(svgBoxId);
        if (svgBox) {
            let svgBoxWidth = svgBox.clientWidth;
            let svgBoxHeight = svgBox.clientHeight;
            let barx = 0;
            while (barx < svgBoxWidth) {
                this.createLine(barx, barx, 0, svgBoxHeight, 1, this.colorMusicBar, '',
                    svgBox)
                barx += song.getTicksPerBar() * horizontalScale;
            }
        }
    }

    // Cleans the graphic and the information svg boxes
    private cleanSvg(svgBoxId: string) {
        let svgBox = document.getElementById(svgBoxId);
        let parentElement = svgBox.parentElement;
        let emptySvg = svgBox.cloneNode(false);
        parentElement.removeChild(svgBox);
        parentElement.appendChild(emptySvg);
        svgBox = document.getElementById(svgBoxId);
    }


}