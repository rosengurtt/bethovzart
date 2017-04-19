import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AudioControlsEventsService } from './audio-controls-events.service';
import { SliderSoretComponent } from './slider-soret.component';

@NgModule({
  imports: [CommonModule],
  exports: [
    CommonModule,
    FormsModule,
    SliderSoretComponent
  ],
  declarations: [SliderSoretComponent],
  providers: [AudioControlsEventsService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
