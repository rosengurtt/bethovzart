import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
//import { AudioControlsEventsService } from '../audio-controls/audio-controls-events.service';
import { SongDisplayComponent } from './song-display.component';
import { TrackDisplayComponent } from './track-display.component';

@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        SongDisplayComponent,
        TrackDisplayComponent
    ],
    providers: [
    //   AudioControlsEventsService
    ],
    exports: [
        SongDisplayComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SongDisplayModule { }
