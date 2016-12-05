import { Injectable } from '@angular/core';
import { Midi2JsonService } from '../midi/midi2json.service'
import { songJson } from '../midi/song-json';
import { SongDisplayService } from './song-display.service'

declare var MIDIjs: any;

@Injectable()
export class AudioControlsService {

    song: songJson;
    svgPlayControlBox: any; // The svg box that has an horizontal bar and a circle that can be slided in the bar
    progressControl: any;  // Circle used to select a position in the song
    timeStarted: number; // The number of milliseconds since 1/1/1970 when the song started to play
    timer: any;
    svgBoxWidth: number; // The length in pixels of the svg html element

    //Absolute measures
    XcoordOfSvgBox: number;  // The x coordinate of the svg html element left side
    radioOfProgressControl: number = 12; // The size in pixels of the circle used as progress control
    usableWidthOfProgressControlBar: number;  // The number of pixels that the control bar can be moved (it is not the same
    // as the width of the svg box because the circle has a finite radius)
    xOfZeroOfProgressControl: number; // x coodinate when progress control is at start of song
    xOfEndOfProgressControl: number;  // x coordinate when progress control is at end of song
    xOfProgressControl: number;  // x coordinate of progress control now

    //Relative measures
    progressControlPositionAtStartInTicks: number;  // A value of position inside the song, measured in ticks
    progressControlPositionCurrentInTicks: number;
    progressControlPositionAtStartInPixels: number; // The position of the control relative to the left side 
    progressControlPositionCurrentInPixels: number; // in the usableWidthOfProgressControlBar measured in pixels. 
    //If it is at the beginning it is 0, if it is at the end,
    // it is usableWidthOfProgressControlBar



    constructor(private _midi2jsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService) {
    }

    public Initialize(songData: songJson) {
        this.song = songData;
        this.svgPlayControlBox = document.getElementById('svgPlayControlsBox');
        this.progressControl = document.getElementById('progressControl');
        this.progressControl.setAttributeNS(null, 'cx', this.radioOfProgressControl);
        this.svgPlayControlBox.appendChild(this.progressControl);
        this.svgBoxWidth = this.svgPlayControlBox.clientWidth;
        this.XcoordOfSvgBox = this.GetAbsXofElement(this.svgPlayControlBox);
        this.usableWidthOfProgressControlBar = this.svgBoxWidth - 2 * this.radioOfProgressControl;
        this.xOfZeroOfProgressControl = this.XcoordOfSvgBox + this.radioOfProgressControl;
        this.xOfEndOfProgressControl = this.xOfZeroOfProgressControl + this.usableWidthOfProgressControlBar;
        this.progressControlPositionAtStartInTicks = 0;
        this.progressControlPositionCurrentInTicks = 0;
        this.progressControlPositionAtStartInPixels = 0;
        this.progressControlPositionCurrentInPixels = 0;
    }
    public songStarted() {
        this.progressControlPositionAtStartInTicks = this.progressControlPositionCurrentInTicks;
        this.progressControlPositionAtStartInPixels = this.progressControlPositionCurrentInPixels;
        let d: Date = new Date();
        this.timeStarted = d.getTime();
        let self = this;
        this.timer = setInterval(function () {
            self.UpdateProgress();
        }, 1000);
        this._songDisplayService.songStarted();
    }

    public songPaused() {
        clearTimeout(this.timer);
    }

    public goToBeginning() {
        this.positionProgressControlInPixels(0);
    }
    public goToEnd() {
        this.positionProgressControlInPixels(this.usableWidthOfProgressControlBar);
    }
    public songStopped() {
        clearTimeout(this.timer);
        this.positionProgressControlInPixels(0);
        this._songDisplayService.songStopped();
    }
    private UpdateProgress() {
        if (this.progressControlPositionCurrentInPixels === this.usableWidthOfProgressControlBar) {
            this.songStopped();
            this._songDisplayService.songStopped();
            return;
        }
        let d: Date = new Date();
        let elapsedTimeInSeconds: number = (d.getTime() - this.timeStarted) / 1000;
        let ticksSinceStartedToPlay: number = elapsedTimeInSeconds * this.song.durationInTicks / this.song.durationInSeconds;

        let ticksFromBeginningOfSong = this.progressControlPositionAtStartInTicks + ticksSinceStartedToPlay;
        this.positionProgressControlInTicks(ticksFromBeginningOfSong);
        this._songDisplayService.UpdateProgress(this.xOfProgressControl);
    }
    public MoveControl(evt: any) {
        this.positionProgressControlInPixels(evt.clientX - this.xOfZeroOfProgressControl);
    }

    // Since the user can move the progress control slide to start the song from any
    // place, we need to send to the midi driver only the note bytes from this point in time
    public GetSongBytesFromStartingPosition(): ArrayBuffer {
        return this._midi2jsonService.getMidiBytes(this.song.getSliceStartingFromTick(this.progressControlPositionCurrentInTicks));
    }

    private GetAbsXofElement(element: any) {
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
        let xInPixels = xInTicks * this.usableWidthOfProgressControlBar / this.song.durationInTicks;
        this.xOfProgressControl = this.radioOfProgressControl + xInPixels;
        this.progressControl.setAttributeNS(null, 'cx', this.xOfProgressControl);
        this.progressControlPositionCurrentInPixels = xInPixels;
        this.progressControlPositionCurrentInTicks = xInTicks;
    }
}