import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
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
    ],
    exports: [
        SongDisplayComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SongDisplayModule { }
