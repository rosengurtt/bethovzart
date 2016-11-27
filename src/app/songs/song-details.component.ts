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
    selector: "song-details",
    template: `
        <div *ngIf='song'>
        <span>{{song.name}} - {{song._id}}</span>
        <play-controls [selectedSongId]="selectedSongId"></play-controls>
        </div>
        <div>
            <svg id="svgBox" width="100%" height="100%" style="border: 1px solid black; background-color:white" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <circle id="note" fill="black" r="1" />
                    <line id="separator" x1="0"  style="stroke:rgb(200,180,170);stroke-width:1" />
                    <line id="progressBar" width="2" style="stroke:rgb(200,0,0);" />
                </defs>
            </svg>
        </div>
    `
})
export class SongDetailsComponent implements OnChanges  {
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
          //  this.song.jsonFile = await this._midi2JsonService.getMidiObject(this.song.midiFile);
         //   console.log(this.song.jsonFile);
          //  this._songDisplayService.songDisplay(this.song.jsonFile);
        };
    }
    // playSong() {
    //     this._songDisplayService.songStarted();
    //     MIDIjs.play(this.song.midiFile);
    // }
    // stopSong() {
    //     this._songDisplayService.songStopped();
    //     MIDIjs.stop();
    // }
}

