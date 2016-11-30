import { Component, Input, OnDestroy, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { Song } from './song';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi2json.service';
import { IMusicStyle } from './music-style';
import { Band } from './band';
import { SongSearchService } from './song-search.service';
import { SongDisplayService } from '../graphics/song-display.service';
import { AudioControlsService } from '../graphics/audio-controls.service'

declare var MIDIjs: any;

@Component({
    selector: "play-controls",
    template: `
        <div >       
        <button type="button" class="btn btn-primary" (click)="playSong()">Play</button>
        <button type="button" class="btn btn-primary" (click)="stopSong()">Stop</button>
        </div>
        <div id="midiPlayControls" (PlayStarted) = MidiSoundStarted()>
            <svg id="svgPlayControlsBox" width="100%" height="30" 
                style="background-color:#272b30" (mouseout)='MouseUp()'
                xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="13" width="100%" height="6" 
                fill="url(#Gradient1)" />               
                <circle id="progressControl" fill="black" cy="16" r="12" 
                     class="draggable" (mousedown)='ProgressControlClicked($event)'
                     (mousemove)='MoveControl($event)' (mouseup)='MouseUp()'
                     fill="url(#Gradient2)"/> 
                <defs>
                    <linearGradient id="Gradient1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#A40"/>
                        <stop offset="100%" stop-color="#AA3"/>
                    </linearGradient>     
                    <radialGradient id="Gradient2">
                        <stop offset="0%" stop-color="#AA3"/>
                        <stop offset="100%" stop-color="#A40"/>
                    </radialGradient>     
                </defs>  
            </svg>
        </div>
    `,
    styles: ['.draggable {cursor: move; }']
})
export class PlayControlsComponent implements OnChanges {
    song: Song;
    @Input() selectedSongId: string;
    progressControl: any;
    mouseDown: boolean = false;

    constructor(private _songService: SongRepositoryService,
        private _midi2JsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService,
        private _audioControlsService: AudioControlsService) {
    }


    async ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        for (let propName in changes) {
            let changedProp = changes[propName];
            let from = JSON.stringify(changedProp.previousValue);
            let to = JSON.stringify(changedProp.currentValue);
            if (propName == "selectedSongId" && to !== "")
                this.GetSongData();
        }
    }
    async GetSongData() {
        if (this.selectedSongId && this.selectedSongId !== "") {
            let songData: any = await (this._songService.getSongById(this.selectedSongId));

            this.song = new Song();
            this.song.name = songData.name;
            this.song._id = this.selectedSongId;
            this.song.band = new Band();
            this.song.band._id = songData.band;
            this.song.band.name = songData.band.name;
            this.song.midiFile = await (this._songService.getSongMidiById(this.selectedSongId));
            this.song.jsonFile = await this._midi2JsonService.getMidiObject(this.song.midiFile);
            console.log(this.song.jsonFile);
            this._songDisplayService.songDisplay(this.song.jsonFile);
            this._audioControlsService.Initialize(this.song.jsonFile);
        };
    }
    playSong() {
        let songPartToPlay: ArrayBuffer = this._audioControlsService.GetSongBytesFromStartingPosition();
        MIDIjs.play(songPartToPlay);
    }
    stopSong() {
        console.log("entre a song stop de play component")
        this._songDisplayService.songStopped();
        this._audioControlsService.songStopped()
        MIDIjs.stop();
    }
    @HostListener('mousedown', ['$event'])
    public ProgressControlClicked(evt: MouseEvent) {
        this.progressControl = document.getElementById("progressControl");
        this.mouseDown = true;
    }
    @HostListener('mousemove', ['$event'])
    public MoveControl(evt: MouseEvent) {
        if (this.mouseDown) {
            this._audioControlsService.MoveControl(evt);
        }
    }
    @HostListener('mouseup')
    public MouseUp() {
        this.mouseDown = false;
    }
    @HostListener('PlayStarted')
    MidiSoundStarted() {
        this._songDisplayService.songStarted();
        this._audioControlsService.songStarted()
    }
}

