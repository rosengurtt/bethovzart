import { Component, Input, OnDestroy, OnChanges, SimpleChange } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Song } from './song';
import { SongJson } from '../midi/song-json/song-json';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { Band } from './band';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';

declare var MIDIjs: any;

@Component({
    selector: "song-details",
    templateUrl: './song-details.component.html'
})
export class SongDetailsComponent implements OnChanges {
    song: Song;
    songJson: SongJson;
    @Input() selectedSongId: string;
    isCollapsed = false;
    subscriptionAudioEvents: Subscription;

    constructor(
        private _songService: SongRepositoryService,
        private _midi2JsonService: Midi2JsonService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }
    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.collapseDisplay:
                this.isCollapsed = true;
                break;
            case AudioControlsEventTypes.expandDisplay:
                this.isCollapsed = false;
                break;
        }
    }


    async ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        for (let propName in changes) {
            if (true) { // useless if added to avoid having lint complaining
                let changedProp = changes[propName];
                let from = JSON.stringify(changedProp.previousValue);
                let to = JSON.stringify(changedProp.currentValue);
                if (propName === 'selectedSongId' && to !== '') {
                    this.GetSongData();
                }
            }
        }
    }
    async GetSongData() {
        if (this.selectedSongId && this.selectedSongId !== '') {
            let songData: any = await (this._songService.getSongById(this.selectedSongId));

            this.song = new Song();
            this.song.name = songData.name;
            this.song._id = this.selectedSongId;
            this.song.band = new Band();
            this.song.band._id = songData.band;
            this.song.band.name = songData.band.name;
            this.song.midiFile = await (this._songService.getSongMidiById(this.selectedSongId));
            this.songJson = this._midi2JsonService.getMidiObject(this.song.midiFile);
        };
    }
}

