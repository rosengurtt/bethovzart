import { NgModule, CUSTOM_ELEMENTS_SCHEMA  }  from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StarComponent } from './star.component';

@NgModule({
  imports: [ CommonModule],
  exports : [
    CommonModule,
    FormsModule,
    StarComponent
  ],
  declarations: [ StarComponent ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
