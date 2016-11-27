import { Component, Input, OnDestroy, OnChanges, SimpleChange } from '@angular/core';

import { Song } from './song';
import { SongService } from './song.service';
import { Midi2JsonService } from '../midi/midi2json.service';
import { IMusicStyle } from './music-style';
import { Band } from './band';
import { SongSearchService } from './song-search.service';
import { SongDisplayService } from '../graphics/song-display.service';

declare var MIDIjs: any;

@Component({
    selector: "play-controls",
    template: `
        <div >       
        <button type="button" class="btn btn-primary" (click)="playSong()">Play</button>
        <button type="button" class="btn btn-primary" (click)="stopSong()">Stop</button>
        </div>
        <div>
            <svg id="svgPlayControlsBox" width="100%" height="20" 
                style="background-color:#272b30" 
                xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="10" width="100%" height="4" style="fill:rgb(200,240,220)" />
                <defs>
                    <rect id="progressControl" fill="black" height="16" width="5" y="3" 
                    style="fill:rgb(250,200,210)"/>
                </defs>
            </svg>
        </div>
    `
})
export class PlayControlsComponent implements OnChanges {
    song: Song;
    @Input() selectedSongId: string;

    constructor(private _songService: SongService,
        private _midi2JsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService) {
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
        };
    }
    playSong() {
        this._songDisplayService.songStarted();
        MIDIjs.play(this.song.midiFile);
    }
    stopSong() {
        this._songDisplayService.songStopped();
        MIDIjs.stop();
    }
}

