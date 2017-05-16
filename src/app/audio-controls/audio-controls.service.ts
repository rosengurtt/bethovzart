import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { Midi2JsonService } from '../midi/midi-to-json.service';
import { SongJson } from '../midi/song-json/song-json';
import { Uint8Array2ArrayBuffer } from '../shared/uint8array-to-arraybuffer';
import { AudioControlEvent } from '../shared/audio-control-event';
import { AudioControlsEventTypes } from '../shared/audio-controls-event-types.enum';
import { AudioControlsEventsService } from '../shared/audio-controls-events.service';

declare var MIDIjs: any;

@Injectable()
export class AudioControlsService {

    isPlaying = false;
    isRestarting = false;
    subscriptionAudioEvents: Subscription;
    song: SongJson;
    sliderPositionAtStart: number = 0;
    mutedTracks: number[];
    volumeTracks: number[]; // initially is the volume read from the file, but the user can change it
    songPartToPlay: ArrayBuffer;
    tempo: number;



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
                this.isPlaying = true;
                this.sliderPositionAtStart = event.data;
                this.songPartToPlay = this.getSongBytesFromStartingPosition();
                MIDIjs.play(this.songPartToPlay);
                break;

            case AudioControlsEventTypes.pause:
                this.isPlaying = false;
                MIDIjs.stop();
                break;

            case AudioControlsEventTypes.stop:
                this.isPlaying = false;
                MIDIjs.stop();
                break;
            case AudioControlsEventTypes.trackMuted:
                // check if the track is already in the list of muted tracks
                if (this.mutedTracks.indexOf(event.data) === -1) {
                    // it is not in the list, then add it
                    this.mutedTracks.push(event.data);
                }
                this.restartSong();
                break;
            case AudioControlsEventTypes.trackUnmuted:
                let index = this.mutedTracks.indexOf(event.data)
                if (index !== -1) {
                    this.mutedTracks.splice(index, 1);
                }
                this.restartSong();
                break;
            case AudioControlsEventTypes.trackSolo:
                this.mutedTracks = [];
                for (let i = 0; i < this.song.notesTracks.length; i++) {
                    if (this.song.notesTracks[i].trackNumber !== event.data) {
                        this.mutedTracks.push(this.song.notesTracks[i].trackNumber);
                    }
                }
                this.restartSong();
                break;
            case AudioControlsEventTypes.trackUnsolo:
                this.mutedTracks = [];
                this.restartSong();
                break;
            case AudioControlsEventTypes.volumeChange:
                let trackNumber = event.data.trackNumber;
                let volume = event.data.volume;
                this.volumeTracks[trackNumber] = volume;
                this.restartSong();
                break;
            case AudioControlsEventTypes.tempoChange:
                let newTempo = event.data;
                this.tempo = newTempo;
                this.restartSong();
                break;
            case AudioControlsEventTypes.restart:
                this.restartSong();
                break;
            case AudioControlsEventTypes.reset:
                this.initialize(this.song);
                this.restartSong();
                break;
        }
    }

    public initialize(songData: SongJson) {
        this.song = songData;
        this.tempo = this.song.tempoEvents[0].tempoBPM;
        this.mutedTracks = [];
        this.volumeTracks = [];
        for (let i = 0; i < this.song.tracks.length; i++) {
            this.volumeTracks.push(this.song.tracks[i].Volume);
        }
    }

    public getSongBytesFromStartingPosition(): ArrayBuffer {
        let positionControlLocationCurrentInTicks = this.song.durationInTicks * this.sliderPositionAtStart;
        let sliceFromCurrentPosition =
            this.song.getSliceStartingFromTick(positionControlLocationCurrentInTicks, this.mutedTracks, this.volumeTracks, this.tempo);
        let midiBytes = this._midi2jsonService.getMidiBytes(sliceFromCurrentPosition);
        return Uint8Array2ArrayBuffer.convert(midiBytes);
    }

    private restartSong() {
        if (!this.isPlaying || this.isRestarting) {
            return;
        }
        this.isRestarting = true;
        let self = this;
        setTimeout(function () {
            self._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.pause);
        }, 10);
        setTimeout(function () {
            self.isRestarting = false;
            self._audioControlsEventsService.raiseEvent(AudioControlsEventTypes.play);
        }, 1500);
    }
}

