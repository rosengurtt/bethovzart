import { Component, Input, OnDestroy, OnChanges, SimpleChange } from '@angular/core';

import { Song } from './song';
import { SongService } from './song.service';
import { IMusicStyle } from './music-style';
import { Band } from './band';
import { SongSearchService } from './song-search.service';
declare var MIDIjs: any;

@Component({
    selector: "song-details",
    template: `
        <div *ngIf='song'>
        <span>{{song.name}} - {{song._id}}</span>
        <button type="button" class="btn btn-primary" (click)="playSong()">Play</button>
        <button type="button" class="btn btn-primary" (click)="stopSong()">Stop</button>
        </div>
    `
})
export class SongDetailsComponent implements OnChanges {
    song: Song;
    @Input() selectedSongId: string;

    constructor(private _songService: SongService) {
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
            this.song.midiFile= await (this._songService.getSongMidiById(this.selectedSongId));
            
        };
    }
    playSong() {
        MIDIjs.play(this.song.midiFile);
    }
    stopSong() {
        MIDIjs.stop();
    }
}

