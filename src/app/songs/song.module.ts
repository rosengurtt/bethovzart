import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SongListComponent } from './song-list.component';
import { SongDetailsComponent } from './song-details.component';
import { PlayControlsComponent } from './play-controls.component';

import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongDisplayService } from '../graphics/song-display.service';
import { AudioControlsService } from '../graphics/audio-controls.service';
import { MidiFileCheckerService } from '../midi/midi-file-checker.service';

import { SongFilterPipe } from './song-filter.pipe';

import { SharedModule } from '../shared/shared.module';
import { FileUploadService } from '../shared/file-upload.service';
import { SortPipe } from '../shared/sort-by.pipe';

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
    PlayControlsComponent,
    SortPipe
  ],
  providers: [
    SongRepositoryService,
    FileUploadService,
    Midi2JsonService,
    SongDisplayService,
    AudioControlsService,
    MidiFileCheckerService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SongModule { }
