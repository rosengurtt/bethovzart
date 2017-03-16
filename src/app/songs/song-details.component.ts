import { Component, Input, OnDestroy, OnChanges, SimpleChange } from '@angular/core';

import { Song } from './song';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { Band } from './band';
import { SongDisplayService } from '../graphics/song-display.service';

declare var MIDIjs: any;

@Component({
    selector: "song-details",
    templateUrl:'./song-details.component.html'
})
export class SongDetailsComponent implements OnChanges {
    song: Song;
    @Input() selectedSongId: string;

    constructor(private _songService: SongRepositoryService,
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
        };
    }
    public informationClick(event){
        this._songDisplayService.InformationAreaClicked(event.offsetX, event.offsetY);
    }
}

