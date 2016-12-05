import { Component, Input, OnDestroy, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { Song } from './song';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi2json.service';
import { IMusicStyle } from './music-style';
import { Band } from './band';
import { SongSearchService } from './song-search.service';
import { SongDisplayService } from '../graphics/song-display.service';
import { AudioControlsService } from '../graphics/audio-controls.service'
import { Binary2base64 } from '../shared/binary2base64';

declare var MIDIjs: any;

@Component({
    selector: "play-controls",
    template: `
        <div >       
        <button type="button" class="btn btn-danger" (click)="goToBeginning()">
            <span class="glyphicon glyphicon-backward"></span>&nbsp;
        </button>
        <button type="button" class="btn btn-danger" (click)="playSong()">
            <span class="glyphicon glyphicon-play"></span>&nbsp;
        </button>
        <button type="button" class="btn btn-danger" (click)="pauseSong()">
            <span class="glyphicon glyphicon-pause"></span>&nbsp;
        </button>
        <button type="button" class="btn btn-danger" (click)="stopSong()">
            <span class="glyphicon glyphicon-stop"></span>&nbsp;
        </button>
        <button type="button" class="btn btn-danger" (click)="goToEnd()">
            <span class="glyphicon glyphicon-forward"></span>&nbsp;
        </button>
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
    mouseDown: boolean = false;
    isPlaying: boolean = false;
    loadFinished: boolean;

    constructor(private _songService: SongRepositoryService,
        private _midi2JsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService,
        private _audioControlsService: AudioControlsService) {
    }


    async ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        this.loadFinished = false;
        for (let propName in changes) {
            let changedProp = changes[propName];
            let from = JSON.stringify(changedProp.previousValue);
            let to = JSON.stringify(changedProp.currentValue);
            if (propName == "selectedSongId" && to !== "")
                this.GetSongData();
            this.loadFinished = true;
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
        if (this.loadFinished) {
            let songPartToPlay: ArrayBuffer = this._audioControlsService.GetSongBytesFromStartingPosition();
            // this.download("midifile.txt", songPartToPlay);
            MIDIjs.play(songPartToPlay);
            this.isPlaying = true;
        }
    }

    pauseSong() {
        if (this.isPlaying) {
            this._songDisplayService.songPaused();
            this._audioControlsService.songPaused()
            MIDIjs.stop();
            this.isPlaying = false;
        }
    }
    stopSong() {
        if (this.isPlaying) {
            this._songDisplayService.songStopped();
            this._audioControlsService.songStopped()
            MIDIjs.stop();
            this.isPlaying = false;
        }
    }

    goToBeginning() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToBeginning();
        }
    }
    goToEnd() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToEnd();
        }
    }
    //used for debugging. Allows to save buffer to disk
    private download(filename, buffer) {
        let base64encoded = Binary2base64.convert(buffer);
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64encoded));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    public ProgressControlClicked(evt: MouseEvent) {
        this.mouseDown = true;
    }

    public MoveControl(evt: MouseEvent) {
        if (this.loadFinished && this.mouseDown) {
            this._audioControlsService.MoveControl(evt);
        }
    }

    public MouseUp() {
        this.mouseDown = false;
    }
    @HostListener('PlayStarted')
    MidiSoundStarted() {
        this._audioControlsService.songStarted();
    }
    @HostListener('PlayFinished') top
    MidiSoundFinished() {
        this._audioControlsService.songStopped();
    }
}

