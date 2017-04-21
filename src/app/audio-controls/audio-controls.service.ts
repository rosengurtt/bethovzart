import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json';
import { Uint8Array2ArrayBuffer } from '../shared/uint8array-to-arraybuffer';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';

declare var MIDIjs: any;

@Injectable()
export class AudioControlsService {

    subscriptionAudioEvents: Subscription;
    song: SongJson;
    sliderPositionAtStart: number = 0;
    mutedTracks: number[];



    constructor(
        private _midi2jsonService: Midi2JsonService,
        private _audioControlsEventsService: AudioControlsEventsService) {
        this.subscriptionAudioEvents = this._audioControlsEventsService
            .getEvents().subscribe(event => {
                this.handleEvent(event);
            });
    }

    private handleEvent(event: AudioControlEvent) {
        switch (event.type) {
            case AudioControlsEventTypes.playStartPositionCalculated:
                this.sliderPositionAtStart = event.data;
                let songPartToPlay: ArrayBuffer = this.getSongBytesFromStartingPosition();
                MIDIjs.play(songPartToPlay);
                break;

            case AudioControlsEventTypes.pause:
                MIDIjs.stop();
                break;

            case AudioControlsEventTypes.stop:
                MIDIjs.stop();
                break;
            case AudioControlsEventTypes.trackMuted:
                if (this.mutedTracks.indexOf(event.data) === -1) {
                    this.mutedTracks.push(event.data);
                }
                break;
            case AudioControlsEventTypes.trackUnmuted:
                let index = this.mutedTracks.indexOf(event.data)
                if (index !== -1) {
                    this.mutedTracks.splice(index, 1);
                }
                break;
            case AudioControlsEventTypes.trackSolo:
                this.mutedTracks = [];
                for (let i = 0; i < this.song.notesTracks.length; i++) {
                    if (this.song.notesTracks[i].trackNumber !== event.data) {
                        this.mutedTracks.push(this.song.notesTracks[i].trackNumber);
                    }
                }
                break;
            case AudioControlsEventTypes.trackUnsolo:
                this.mutedTracks = [];
                break;
        }
    }

    public initialize(songData: SongJson) {
        this.song = songData;
        this.mutedTracks = [];
    }

    public getSongBytesFromStartingPosition(): ArrayBuffer {
        let positionControlLocationCurrentInTicks = this.song.durationInTicks * this.sliderPositionAtStart;
        let sliceFromCurrentPosition = this.song.getSliceStartingFromTick(positionControlLocationCurrentInTicks, this.mutedTracks);
        let midiBytes = this._midi2jsonService.getMidiBytes(sliceFromCurrentPosition);
        return Uint8Array2ArrayBuffer.convert(midiBytes);
    }
}
