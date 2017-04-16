import { Component, Input } from '@angular/core';

import { SongJson } from '../midi/song-json';

declare var MIDIjs: any;

@Component({
    selector: 'song-display',
    templateUrl: './song-display.component.html'
})
export class SongDisplayComponent  {
    @Input() song: SongJson;

    constructor() {
    }






}

