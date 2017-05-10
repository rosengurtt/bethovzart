import { Component, Input, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SongJson } from '../midi/song-json/song-json';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlEvent } from '../shared/audio-control-event';
import { TrackDisplayService } from '../song-display/track-display.service';
import { GeneralMidiInstrument } from '../shared/general-midi-instrument';

declare var MIDIjs: any;

@Component({
    selector: 'tracks-collapsed',
    templateUrl: './tracks-collapsed.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class TracksCollapsedComponent implements AfterViewChecked {
    @Input() song: SongJson;
    subscriptionAudioEvents: Subscription;
    isInitialized = false;
    songIsPlaying: boolean;
    svgBoxId = 'svgBoxCollapsed';
    svgBox: any;  // html svg element where the music is shown graphically
    svgBoxWidth: number;
    progressBarId = 'progressBar';
    trackInfo: string;
    muteButtonCurrentImage: string = './app/assets/images/speakerOn.png';

    constructor(
        private _trackDisplayService: TrackDisplayService) {
    }



    ngAfterViewChecked() {
        if (!this.isInitialized) {
            this._trackDisplayService.initialize(this.song);
            this._trackDisplayService.drawTracksCollapsedGraphic();
            this.isInitialized = true;
            for (let i = 0; i < this.song.notesTracks.length; i++) {
               // this.trackInfo += GeneralMidiInstrument.GetInstrumentName(this.song.notesTracks[i].instrument) + ',';
            }
        }
    }



}