import { Injectable } from '@angular/core';
import { trackNote } from '../midi/track-note';
import { notesTrack } from '../midi/notes-track';
import { trackRange } from '../midi/track-range';
import { songJson } from '../midi/song-json';
import { midiEvent } from '../midi/midi-event';

@Injectable()
export class SongDisplayService {

    notesTracks: notesTrack[];
    noTracks: number;
    noTracksWithNotes: number = 0;
    songDurationInTicks: number;
    songDurationInSeconds: number;
    svgSongDisplayBox: any;
    svgPlayControlBox: any;
    svgns: string = "http://www.w3.org/2000/svg";
    svgBoxWidth: number;
    svgBoxHeight: number;
    separationBetweenTracks: number;
    trackHeight: number;
    clonableDot: any;
    clonableLine: any;
    progressBar: any;
    progressControl: any;
    timer: any;
    timeStarted: number;
    clonableProgressBar: any;
    clonableProgressControl: any;

    public async songDisplay(songData: songJson) {
        this.Initialize();
        this.notesTracks = this.getNotesSequences(songData.tracks);
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
        this.songDurationInTicks = this.getSongDurationInTicks(this.notesTracks);
        this.songDurationInSeconds = this.getSongDurationInSeconds(songData);
        this.Draw();
    }
    private Initialize() {

        this.svgSongDisplayBox = document.getElementById("svgBox");
        this.svgPlayControlBox = document.getElementById("svgPlayControlsBox");
        this.clonableProgressControl = document.getElementById("progressControl");

        this.clonableProgressBar = document.getElementById("progressBar");

        this.trackHeight = 150; //Default
        this.separationBetweenTracks = 6;
        this.noTracksWithNotes = 0;
        this.progressControl = this.clonableProgressControl.cloneNode(true);
        this.progressControl.setAttributeNS(null, "x", 0);
        this.svgPlayControlBox.appendChild(this.progressControl);
    }


    public songStarted() {
        this.progressBar = this.clonableProgressBar.cloneNode(true);
        this.svgSongDisplayBox.appendChild(this.progressBar);
        this.progressBar.setAttributeNS(null, "x1", 0);
        this.progressBar.setAttributeNS(null, "x2", 0);
        this.progressBar.setAttributeNS(null, "y1", 0);
        this.progressBar.setAttributeNS(null, "y2", this.svgBoxHeight);
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
        this.progressControl.setAttributeNS(null, "x", 0);
    }
    private UpdateProgress() {
        let d: Date = new Date();
        let elapsedTime = d.getTime() - this.timeStarted;
        let controlX = ((elapsedTime / 1000) / this.songDurationInSeconds) * this.svgBoxWidth;
        this.progressBar.setAttributeNS(null, "x1", controlX);
        this.progressBar.setAttributeNS(null, "x2", controlX);
        this.progressControl.setAttributeNS(null, "x", controlX);
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
                let note = noteSeq[m];
                let cx = note.ticksFromStart * horizontalScale;
                let cy = verticalShift - ((note.pitch - thisTrack.range.minPitch)) * verticalScale;
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

    //Returns the lowest and highest pitches in a track
    private getTrackRange(t: trackNote[]): trackRange {
        let returnValue = new trackRange(500, 0);
        for (let i = 0; i < t.length; i++) {
            let pitch = t[i].pitch;
            if (pitch < returnValue.minPitch) returnValue.minPitch = pitch;
            if (pitch > returnValue.maxPitch) returnValue.maxPitch = pitch;
        }
        return returnValue;
    }

    //Returns the number of ticks in the whole song
    private getSongDurationInTicks(tracks: notesTrack[]): number {
        let duration: number = 0;
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].notesSequence.length > 0) {
                let trackLength: number = tracks[i].notesSequence.length;
                let lastNote: trackNote = tracks[i].notesSequence[trackLength - 1]
                let timeStartsLastNote: number = lastNote.ticksFromStart;
                let durationLastNote = lastNote.duration;
                let endTrack: number = timeStartsLastNote + durationLastNote;
                if (endTrack > duration) {
                    duration = endTrack;
                }
            }
        }
        return duration;
    }
    private getSongDurationInSeconds(songData: songJson): number {
        let duration: number = 0;
        let tempoEvents = this.getTempoEvents(songData);
        for (let i = 0; i < tempoEvents.length; i++) {
            let tempo: number = tempoEvents[i].tempoBPM;
            let start: number = tempoEvents[i].ticksSinceStart;
            let end: number;
            if (i < tempoEvents.length - 1)
                end = tempoEvents[i + 1].ticksSinceStart;
            else
                end = this.songDurationInTicks;
            duration += ((end - start) / songData.ticksPerBeat) / (tempo / 60);
        }
        return duration;
    }
    private getTempoEvents(songData: songJson): midiEvent[] {
        let returnValue: midiEvent[] = [];
        for (let i = 0; i < songData.tracks.length; i++) {
            let track = songData.tracks[i];
            for (let j = 0; j < track.length; j++) {
                if (track[j].type == 255 && track[j].subtype == 81) {
                    returnValue.push(track[j]);
                }
            }
        }
        return returnValue;
    }
    // Convert the midi tracks that have all sort of events, to tracks that have only notes on and notes off
    // In addition, a 'range' property provides the max and minimum pitch for each track
    private getNotesSequences(midiTracks: midiEvent[][]): notesTrack[] {
        let musicTracks: notesTrack[] = [];
        for (let k = 0; k < midiTracks.length; k++) {
            let trackNotes = this.getNotes(midiTracks[k]);
            if (trackNotes.length > 0) {
                let range: trackRange = this.getTrackRange(trackNotes);
                musicTracks.push(new notesTrack(trackNotes, range))
            }
        }
        return musicTracks;
    }

    // Used to get the events in a midi track that correspond to notes on and notes off
    private getNotes(midiTrack: midiEvent[]): trackNote[] {
        let noteOn: number = 9;
        let noteOff: number = 8;
        let returnArray: trackNote[] = [];
        let timeSinceStart = 0;
        let trackLength = midiTrack.length;
        for (let i = 0; i < trackLength; i++) {
            let midiEvent = midiTrack[i];
            timeSinceStart += midiEvent.delta;
            //Loof for note one events         
            if (midiEvent.type === 8 && midiEvent.subtype === noteOn) {
                let pitch = midiEvent.param1;
                let duration = 0;
                //Find corresponding note off
                for (let j = i + 1; j < trackLength; j++) {
                    let nextEvent = midiTrack[j];
                    duration += nextEvent.delta;
                    if (nextEvent.type === 8 && nextEvent.subtype === noteOff && nextEvent.param1 === pitch) {
                        //Found the note off, save the point
                        let note = new trackNote(timeSinceStart, pitch, duration);
                        returnArray.push(note);
                        break;
                    }
                }
            }
        }
        return returnArray;
    }

}