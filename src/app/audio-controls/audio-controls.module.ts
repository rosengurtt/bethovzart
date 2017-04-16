import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AudioControlsComponent } from './audio-controls.component';
import { AudioButtonsComponent } from './audio-buttons.component';
import { SharedModule } from '../shared/shared.module';
import { AudioControlsEventsService } from './audio-controls-events.service';
import { AudioControlsService } from './audio-controls.service';
import { AudioControlBarComponent } from './audio-control-bar.component';


@NgModule({
    imports: [
        SharedModule
    ],
    declarations: [
        AudioButtonsComponent,
        AudioControlsComponent,
        AudioControlBarComponent
    ],
    providers: [
        AudioControlsEventsService,
        AudioControlsService
    ],
    exports: [
        AudioControlsComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AudioControlsModule { }
