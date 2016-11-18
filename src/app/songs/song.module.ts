import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SongListComponent } from './song-list.component';
import { SongDetailsComponent } from './song-details.component';

import { SongService } from './song.service';
import { SongFilterPipe } from './song-filter.pipe';

import { SharedModule } from '../shared/shared.module';
import { FileUploadService } from '../shared/file-upload.service';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild([
      { path: 'songs', component: SongListComponent },
    ])
  ],
  declarations: [
    SongListComponent,
    SongFilterPipe,
    SongDetailsComponent
  ],
  providers: [
    SongService,
    FileUploadService
  ]
})
export class SongModule { }
