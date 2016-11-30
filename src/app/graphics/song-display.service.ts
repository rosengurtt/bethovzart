import { Injectable } from '@angular/core';
import { trackNote } from '../midi/track-note';
import { notesTrack } from '../midi/notes-track';
import { trackRange } from '../midi/track-range';
import { songJson } from '../midi/song-json';
import { midiEvent } from '../midi/midi-event';

@Injectable()
export class SongDisplayService {
    song: songJson;
    notesTracks: notesTrack[];
    noTracks: number;
    noTracksWithNotes: number = 0;
    songDurationInTicks: number;
    songDurationInSeconds: number;
    svgSongDisplayBox: any;
    svgns: string = "http://www.w3.org/2000/svg";
    svgBoxWidth: number;
    svgBoxHeight: number;
    separationBetweenTracks: number;
    trackHeight: number;
    clonableDot: any;
    clonableLine: any;
    progressBar: any;
    timer: any;
    timeStarted: number;
    clonableProgressBar: any;

    constructor() {
    }


    public async songDisplay(songData: songJson) {
        this.song=songData;
        this.Initialize();
        this.notesTracks = this.song.getNotesSequences();
        this.noTracks = this.notesTracks.length;
        for (let t = 0; t < this.noTracks; t++) {
            if (this.notesTracks[t].notesSequence.length > 0) this.noTracksWithNotes++;
        }
        this.svgBoxWidth = this.svgSongDisplayBox.clientWidth;
        this.svgBoxHeight = this.trackHeight * this.noTracksWithNotes;
        if (this.svgBoxHeight > 600)
            this.svgBoxHeight = 600;
        let heightText: string = this.svgBoxHeight + "px";
        this.svgSongDisplayBox.setAttribute("height", heightText);
        this.trackHeight = (this.svgBoxHeight - (this.separationBetweenTracks * (this.noTracksWithNotes - 1))) / this.noTracksWithNotes;
        this.clonableDot = document.getElementById("note");
        this.clonableLine = document.getElementById("separator");
        this.songDurationInTicks = this.song.getSongDurationInTicks(this.notesTracks);
        this.songDurationInSeconds = this.song.getSongDurationInSeconds();
        this.Draw();
    }
    private Initialize() {
        this.svgSongDisplayBox = document.getElementById("svgBox");
        this.trackHeight = 150; //Default
        this.separationBetweenTracks = 6;
        this.noTracksWithNotes = 0;
    }


    public songStarted() {
        this.CreateProgressBar();
        let d: Date = new Date();
        this.timeStarted = d.getTime();
        let self = this;
        this.timer = setInterval(function () {
            self.UpdateProgress();
        }, 1000);
    }
    public songStopped() {
        clearTimeout(this.timer);
        this.svgSongDisplayBox.removeChild(this.progressBar);
    }
    private UpdateProgress() {
        let d: Date = new Date();
        let elapsedTime = d.getTime() - this.timeStarted;
        let controlX = ((elapsedTime / 1000) / this.songDurationInSeconds) * this.svgBoxWidth + 9;
        this.progressBar.setAttributeNS(null, "x1", controlX);
        this.progressBar.setAttributeNS(null, "x2", controlX);
    }
    public CreateProgressBar() {
        this.progressBar = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.progressBar.setAttributeNS(null, "width", 2);
        this.progressBar.setAttributeNS(null, "x1", 0);
        this.progressBar.setAttributeNS(null, "x2", 0);
        this.progressBar.setAttributeNS(null, "y1", 0);
        this.progressBar.setAttributeNS(null, "y2", this.svgBoxHeight);
        this.progressBar.setAttributeNS(null, "style", "stroke:rgb(200,0,0)");
        this.svgSongDisplayBox.appendChild(this.progressBar);
    }

    private Draw() {
        this.CleanSvg()
        let i = -1; //this index corresponds to tracks shown (we show only tracks with notes)
        for (let n = 0; n < this.notesTracks.length; n++) {
            if (this.notesTracks[n].notesSequence.length === 0) {
                continue;
            }
            i++;
            let thisTrack = this.notesTracks[n];
            let verticalScale: number = this.trackHeight / (thisTrack.range.maxPitch - thisTrack.range.minPitch);
            let horizontalScale: number = this.svgBoxWidth / this.songDurationInTicks;
            let verticalShift: number = ((i + 1) * (this.trackHeight)) + (i * this.separationBetweenTracks);
            let noteSeq: trackNote[] = thisTrack.notesSequence;

            //Add a line separating the tracks
            let separator = this.clonableLine.cloneNode(true);
            let heightOfSeparator = verticalShift + this.separationBetweenTracks / 2;
            separator.setAttributeNS(null, "x2", this.svgBoxWidth);
            separator.setAttributeNS(null, "y1", heightOfSeparator);
            separator.setAttributeNS(null, "y2", heightOfSeparator);
            this.svgSongDisplayBox.appendChild(separator);

            //Create a dot for each note in the track
            for (let m = 0; m < noteSeq.length; m++) {
                let note: trackNote = noteSeq[m];
                let cx: number = note.ticksFromStart * horizontalScale;
                let cy: number
                if (thisTrack.range.maxPitch > thisTrack.range.minPitch) {
                    cy = verticalShift - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
                }
                else {
                    cy = verticalShift / 2;
                }
                let copy = this.clonableDot.cloneNode(true);
                copy.setAttributeNS(null, "cx", cx);
                copy.setAttributeNS(null, "cy", cy);

                this.svgSongDisplayBox.appendChild(copy);
            }
        }
    }
    private CleanSvg() {
        var parentElement = this.svgSongDisplayBox.parentElement;
        var emptySvg = this.svgSongDisplayBox.cloneNode(false);
        parentElement.removeChild(this.svgSongDisplayBox);
        parentElement.appendChild(emptySvg);
        this.svgSongDisplayBox = document.getElementById("svgBox");
    }

}