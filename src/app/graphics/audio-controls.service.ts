import { Injectable } from '@angular/core';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json';
import { SongDisplayService } from './song-display.service';
import { Uint8Array2ArrayBuffer } from '../shared/uint8array-to-arraybuffer'

declare var MIDIjs: any;

@Injectable()
export class AudioControlsService {

    song: SongJson;
    isSongPlaying: boolean;
    svgPlayControlBox: any; // The svg box that has an horizontal bar and a circle that can be slided in the bar
    progressControl: any;  // Circle used to select a position in the song
    svgBoxWidth: number; // The length in pixels of the svg html element

    // Absolute measures
    XcoordOfSvgBox: number;  // The x coordinate of the svg html element left side
    radioOfProgressControl: number = 12; // The size in pixels of the circle used as progress control
    usableWidthOfProgressControlBar: number;  // The number of pixels that the control bar can be moved (it is not the same
    // as the width of the svg box because the circle has a finite radius)
    xOfZeroOfProgressControl: number; // x coodinate when progress control is at start of song
    xOfEndOfProgressControl: number;  // x coordinate when progress control is at end of song
    xOfProgressControl: number;  // x coordinate of progress control now

    // Relative measures
    progressControlPositionAtStartInTicks: number;  // A value of position inside the song, measured in ticks
    progressControlPositionCurrentInTicks: number;
    progressControlPositionAtStartInPixels: number; // The position of the control relative to the left side 
    progressControlPositionCurrentInPixels: number; // in the usableWidthOfProgressControlBar measured in pixels. 
    // If it is at the beginning it is 0, if it is at the end,
    // it is usableWidthOfProgressControlBar



    constructor(private _midi2jsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService) {
    }

    public initialize(songData: SongJson) {
        this.song = songData;
        this.svgPlayControlBox = document.getElementById('svgPlayControlsBox');
        this.progressControl = document.getElementById('progressControl');
        this.progressControl.setAttributeNS(null, 'cx', this.radioOfProgressControl);
        this.svgPlayControlBox.appendChild(this.progressControl);
        this.svgBoxWidth = this.svgPlayControlBox.clientWidth;
        this.XcoordOfSvgBox = this.getAbsXofElement(this.svgPlayControlBox);
        this.usableWidthOfProgressControlBar = this.svgBoxWidth  - 2 * this.radioOfProgressControl;
        this.xOfZeroOfProgressControl = this.XcoordOfSvgBox + this.radioOfProgressControl;
        this.xOfEndOfProgressControl = this.xOfZeroOfProgressControl + this.usableWidthOfProgressControlBar;
        this.progressControlPositionAtStartInTicks = 0;
        this.progressControlPositionCurrentInTicks = 0;
        this.progressControlPositionAtStartInPixels = 0;
        this.progressControlPositionCurrentInPixels = 0;
        this.isSongPlaying = false;
    }
    public songStarted() {
        try {
            this.progressControlPositionAtStartInTicks = this.progressControlPositionCurrentInTicks;
            this.progressControlPositionAtStartInPixels = this.progressControlPositionCurrentInPixels;

            this._songDisplayService.songStarted(this.progressControlPositionAtStartInTicks);
            this.isSongPlaying = true;
        } catch (error) {
            console.log('An exception was raised in audioControlsService.songStarted:');
            console.log(error);
        }
    }

    public songPaused() {
        this.isSongPlaying = false;
    }

    public goToBeginning() {
        this.positionProgressControlInPixels(0);
    }
    public goToEnd() {
        this.positionProgressControlInPixels(this.usableWidthOfProgressControlBar);
    }
    public songStopped() {
        try {
            this.isSongPlaying = false;
            this.positionProgressControlInPixels(0);
            this._songDisplayService.songStopped();
        } catch (error) {
            console.log('An exception was raised in audioControlsService.songStopped:');
            console.log(error);
        }
    }
    public updateProgress(event: any) {
        // This method is called by means of an event. It may be triggered before
        // the song has actually started, so we check if the song is really playing
        if (!this.isSongPlaying) {
            return;
        }
        if (this.progressControlPositionCurrentInPixels === this.usableWidthOfProgressControlBar) {
            this.songStopped();
            this._songDisplayService.songStopped();
            return;
        }
        let elapsedTimeInSeconds: number = event.time;

        let ticksSinceStartedToPlay: number = elapsedTimeInSeconds * this.song.durationInTicks / this.song.durationInSeconds;
        let ticksFromBeginningOfSong = this.progressControlPositionAtStartInTicks + ticksSinceStartedToPlay;
        this.positionProgressControlInTicks(ticksFromBeginningOfSong);

        this._songDisplayService.updateProgress(this.xOfProgressControl);
    }
    public moveControl(evt: any) {
        try {
            this.positionProgressControlInPixels(evt.clientX - this.xOfZeroOfProgressControl);

        } catch (error) {
            console.log('An exception was raised in audioControlsService.MoveControl:');
            console.log(error);
        }
    }

    // Since the user can move the progress control slide to start the song from any
    // place, we need to send to the midi driver only the note bytes from this point in time
    public getSongBytesFromStartingPosition(): ArrayBuffer {
        let mutedTracks: number[] = this._songDisplayService.getMutedTracks();
        let sliceFromCurrentPosition = this.song.getSliceStartingFromTick(this.progressControlPositionCurrentInTicks, mutedTracks);
        let midiBytes = this._midi2jsonService.getMidiBytes(sliceFromCurrentPosition);
        return Uint8Array2ArrayBuffer.convert(midiBytes);
    }

    private getAbsXofElement(element: any) {
        let boundingRect: any = element.getBoundingClientRect();
        return boundingRect.left;
    }
    private positionProgressControlInPixels(xInPixels: number) {
        if (xInPixels < 0) {
            xInPixels = 0;
        }
        if (xInPixels > this.usableWidthOfProgressControlBar) {
            xInPixels = this.usableWidthOfProgressControlBar;
        }
        this.xOfProgressControl = this.radioOfProgressControl + xInPixels;
        this.progressControl.setAttributeNS(null, 'cx', this.xOfProgressControl);
        this.progressControlPositionCurrentInPixels = xInPixels;
        let xInTicks = xInPixels * (this.song.durationInTicks / this.usableWidthOfProgressControlBar);
        this.progressControlPositionCurrentInTicks = xInTicks;
    }

    private positionProgressControlInTicks(xInTicks: number) {
        if (xInTicks < 0) {
            xInTicks = 0;
        }
        if (xInTicks > this.song.durationInTicks) {
            xInTicks = this.song.durationInTicks;
        }
        let xInPixels =
            xInTicks * this.usableWidthOfProgressControlBar / this.song.durationInTicks;
        this.xOfProgressControl = this.radioOfProgressControl + xInPixels;
        this.progressControl.setAttributeNS(null, 'cx', this.xOfProgressControl);
        this.progressControlPositionCurrentInPixels = xInPixels;
        this.progressControlPositionCurrentInTicks = xInTicks;
    }
}