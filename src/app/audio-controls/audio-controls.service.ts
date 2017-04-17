import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { Uint8Array2ArrayBuffer } from '../shared/uint8array-to-arraybuffer';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';

declare var MIDIjs: any;

@Injectable()
export class AudioControlsService {

    subscriptionAudioEvents: Subscription;
    song: SongJson;
    isSongPlaying: boolean;
    svgAudioControlsBox: any; // The svg box that has an horizontal bar and a circle that can be slided in the bar
    positionControl: any;  // Circle used to select a position in the song
    svgAudioControlsBoxWidth: number; // The length in pixels of the svg html element

    // Absolute measures
    XcoordOfSvgAudioControlsBox: number;  // The x coordinate of the svg html element left side
    radioOfPositionControl: number = 12; // The size in pixels of the circle used as progress control
    usableWidthOfProgressControlBar: number;  // The number of pixels that the control bar can be moved (it is not the same
    // as the width of the svg box because the circle has a finite radius)
    xOfZeroOfPositionControl: number; // x coodinate when progress control is at start of song
    xOfEndOfPositionControl: number;  // x coordinate when progress control is at end of song
    xOfPositionControl: number;  // x coordinate of progress control now

    // Relative measures
    positionControlLocationAtStartInTicks: number;  // A value of position inside the song, measured in ticks
    positionControlLocationCurrentInTicks: number;
    positionControlLocationAtStartInPixels: number; // The position of the control relative to the left side 
    positionControlLocationCurrentInPixels: number; // in the usableWidthOfProgressControlBar measured in pixels. 
    // If it is at the beginning it is 0, if it is at the end,
    // it is usableWidthOfProgressControlBar

    mutedTracks: number[];


    constructor(
        private _midi2jsonService: Midi2JsonService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.play:
                this.songStarted()
                break;
            case AudioControlsEventTypes.stop:
                this.songStopped();
                break;
            case AudioControlsEventTypes.pause:
                this.songPaused();
                break;
            case AudioControlsEventTypes.goToBeginning:
                this.goToBeginning();
                break;
            case AudioControlsEventTypes.goToEnd:
                this.goToEnd();
                break;
            case AudioControlsEventTypes.musicProgress:
                this.updateProgress(event.data);
                break;
            case AudioControlsEventTypes.trackMuted:
                if (this.mutedTracks.indexOf(event.data) === -1) {
                    this.mutedTracks.push(event.data);
                }
                break;
            case AudioControlsEventTypes.trackUnmuted:
                let index = this.mutedTracks.indexOf(event.data)
                if (index !== -1) {
                    this.mutedTracks.splice(index, 1);
                }
                break;
        }
    }

    public initialize(songData: SongJson) {
        this.song = songData;
        this.svgAudioControlsBox = document.getElementById('svgAudioControlsBox');
        this.positionControl = document.getElementById('audioPositionControl');
        this.positionControl.setAttributeNS(null, 'cx', this.radioOfPositionControl);
        this.svgAudioControlsBox.appendChild(this.positionControl);
        this.svgAudioControlsBoxWidth = this.svgAudioControlsBox.clientWidth;
        this.XcoordOfSvgAudioControlsBox = this.getAbsXofElement(this.svgAudioControlsBox);
        this.usableWidthOfProgressControlBar = this.svgAudioControlsBoxWidth - 2 * this.radioOfPositionControl;
        this.xOfZeroOfPositionControl = this.XcoordOfSvgAudioControlsBox + this.radioOfPositionControl;
        this.xOfEndOfPositionControl = this.xOfZeroOfPositionControl + this.usableWidthOfProgressControlBar;
        this.positionControlLocationAtStartInTicks = 0;
        this.positionControlLocationCurrentInTicks = 0;
        this.positionControlLocationAtStartInPixels = 0;
        this.positionControlLocationCurrentInPixels = 0;
        this.isSongPlaying = false;
        this.mutedTracks = [];
    }
    public songStarted() {
        try {
            this.positionControlLocationAtStartInTicks = this.positionControlLocationCurrentInTicks;
            this.positionControlLocationAtStartInPixels = this.positionControlLocationCurrentInPixels;

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
        if (this.positionControlLocationCurrentInPixels === this.usableWidthOfProgressControlBar) {
            this.songStopped();
            return;
        }
        let elapsedTimeInSeconds: number = event.time;

        let ticksSinceStartedToPlay: number = elapsedTimeInSeconds * this.song.durationInTicks / this.song.durationInSeconds;
        let ticksFromBeginningOfSong = this.positionControlLocationAtStartInTicks + ticksSinceStartedToPlay;
        this.positionProgressControlInTicks(ticksFromBeginningOfSong);

    }
    public moveControl(x: number) {
        try {
            this.positionProgressControlInPixels(x - this.xOfZeroOfPositionControl);

        } catch (error) {
            console.log('An exception was raised in audioControlsService.MoveControl:');
            console.log(error);
        }
    }

    private tracksMutedChange(trackNumber: number, isMuted: boolean) {

    }

    // Since the user can move the progress control slide to start the song from any
    // place, we need to send to the midi driver only the note bytes from this point in time
    public getSongBytesFromStartingPosition(): ArrayBuffer {
        let sliceFromCurrentPosition = this.song.getSliceStartingFromTick(this.positionControlLocationCurrentInTicks, this.mutedTracks);
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
        this.xOfPositionControl = this.radioOfPositionControl + xInPixels;
        this.positionControl.setAttributeNS(null, 'cx', this.xOfPositionControl);
        this.positionControlLocationCurrentInPixels = xInPixels;
        let xInTicks = xInPixels * (this.song.durationInTicks / this.usableWidthOfProgressControlBar);
        this.positionControlLocationCurrentInTicks = xInTicks;
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
        this.xOfPositionControl = this.radioOfPositionControl + xInPixels;
        this.positionControl.setAttributeNS(null, 'cx', this.xOfPositionControl);
        this.positionControlLocationCurrentInPixels = xInPixels;
        this.positionControlLocationCurrentInTicks = xInTicks;
    }
}