import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SongListComponent } from './song-list.component';
import { SongDetailsComponent } from './song-details.component';
import { PlayControlsComponent } from './play-controls.component';

import { SongService } from './song.service';
import { Midi2JsonService } from '../midi/midi2json.service';
import { SongDisplayService } from '../graphics/song-display.service';

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
    SongDetailsComponent,
    PlayControlsComponent
  ],
  providers: [
    SongService,
    FileUploadService,
    Midi2JsonService,
    SongDisplayService
  ]
})
export class SongModule { }
