import { NgModule, CUSTOM_ELEMENTS_SCHEMA  }  from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@NgModule({
  imports: [ CommonModule],
  exports : [
    CommonModule,
    FormsModule
  ],
  declarations: [ ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
