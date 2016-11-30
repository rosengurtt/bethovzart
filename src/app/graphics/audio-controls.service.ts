import { Injectable } from '@angular/core';
import { Midi2JsonService } from '../midi/midi2json.service'
import { songJson } from '../midi/song-json';

@Injectable()
export class AudioControlsService {

    song: songJson;
    progressControlCurrentX: number;
    svgPlayControlBox: any;
    progressControl: any;
    timeStarted: number;
    timer: any;
    songDurationInSeconds: number;
    svgBoxWidth: number;
    XcoordOfSvgBox: number;
    marginOfProgressControl: number = 12;
    lastX: number;
    widthOfProgressControl: number;
    xOfZeroOfProgressControl: number;
    xOfEndOfProgressControl: number;
    progressControlPositionInTicks: number;

    constructor(private _midi2jsonService: Midi2JsonService) {
    }

    public Initialize(songData: songJson) {
        this.song = songData;
        this.svgPlayControlBox = document.getElementById('svgPlayControlsBox');
        this.progressControl = document.getElementById('progressControl');
        this.progressControl.setAttributeNS(null, 'cx', this.marginOfProgressControl);
        this.svgPlayControlBox.appendChild(this.progressControl);
        this.songDurationInSeconds = this.song.getSongDurationInSeconds();
        this.svgBoxWidth = this.svgPlayControlBox.clientWidth;
        this.XcoordOfSvgBox = this.GetAbsXofElement(this.svgPlayControlBox);
        this.widthOfProgressControl = this.svgBoxWidth - 2 * this.marginOfProgressControl;
        this.xOfZeroOfProgressControl = this.XcoordOfSvgBox + this.marginOfProgressControl;
        this.xOfEndOfProgressControl = this.XcoordOfSvgBox + this.widthOfProgressControl - this.marginOfProgressControl;
    }
    public songStarted() {

        let d: Date = new Date();
        this.timeStarted = d.getTime();
        let self = this;
        this.timer = setInterval(function () {
            self.UpdateProgress();
        }, 1000);
    }
    public songStopped() {
        console.log("entre a songStopped de audio service")
        clearTimeout(this.timer);
        this.progressControl.setAttributeNS(null, 'cx', this.marginOfProgressControl);
    }
    private UpdateProgress() {
        let d: Date = new Date();
        let elapsedTimeInSeconds: number = (d.getTime() - this.timeStarted) / 1000;

        let controlX = (elapsedTimeInSeconds / this.songDurationInSeconds) * this.widthOfProgressControl + this.marginOfProgressControl;
        this.progressControl.setAttributeNS(null, 'cx', controlX);
    }
    public MoveControl(evt: any) {
        let controlX: number;
        if (evt.clientX < this.xOfZeroOfProgressControl) {
            controlX = this.marginOfProgressControl;
        }
        else if (evt.clientX > this.xOfEndOfProgressControl) {
            controlX = this.widthOfProgressControl - this.marginOfProgressControl;
        }
        else {
            controlX = evt.clientX - this.XcoordOfSvgBox;
        }
        this.progressControl.setAttributeNS(null, 'cx', controlX);
    }

    // Since the user can move the progress control slide to start the song from any
    //place, we need to send to the midi driver only the note bytes from this point in time
    public GetSongBytesFromStartingPosition(): ArrayBuffer {
        return this._midi2jsonService.getMidiBytes(this.song);
    }

    private GetAbsXofElement(element: any) {
        let boundingRect: any = element.getBoundingClientRect();
        return boundingRect.left;
    }
}