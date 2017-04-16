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
import { PlayControlsEventsService } from '../graphics/play-controls-events.service';

import { SongFilterPipe } from './song-filter.pipe';

import { SharedModule } from '../shared/shared.module';
import { AudioControlsModule } from '../audio-controls/audio-controls.module';
import { SongDisplayModule } from '../song-display/song-display.module';
import { FileUploadService } from '../shared/file-upload.service';
import { TrackDisplayComponent } from '../songs/track-display.component';
import { SortPipe } from '../shared/sort-by.pipe';

@NgModule({
  imports: [
    SharedModule,
    AudioControlsModule,
    SongDisplayModule,
    RouterModule.forChild([
      { path: 'songs', component: SongListComponent },
    ])
  ],
  declarations: [
    SongListComponent,
    SongFilterPipe,
    SongDetailsComponent,
    PlayControlsComponent,
    TrackDisplayComponent,
    SortPipe
  ],
  providers: [
    SongRepositoryService,
    FileUploadService,
    Midi2JsonService,
    SongDisplayService,
    AudioControlsService,
    MidiFileCheckerService,
    PlayControlsEventsService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SongModule { }
