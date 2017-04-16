import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AudioControlsComponent } from './audio-controls.component';
import { AudioButtonsComponent } from './audio-buttons.component';
import { SharedModule } from '../shared/shared.module';
import { AudioControlsEventsService } from './audio-controls-events.service';
import { AudioProgressBarComponent } from './audio-progress-bar.component';


@NgModule({
    imports: [
        SharedModule

    ],
    declarations: [
        AudioButtonsComponent,
        AudioControlsComponent,
        AudioProgressBarComponent
    ],
    providers: [
        AudioControlsEventsService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AudioControlsModule { }
