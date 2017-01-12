import { Component, Input, OnDestroy, OnChanges, SimpleChange, HostListener } from '@angular/core';

import { Song } from './song';
import { SongRepositoryService } from './song-repository.service';
import { Midi2JsonService } from '../midi/midi2json.service';
import { Band } from './band';
import { SongDisplayService } from '../graphics/song-display.service';
import { AudioControlsService } from '../graphics/audio-controls.service'
import { Binary2base64 } from '../shared/binary2base64';
import { MidiFileCheckerService } from '../midi/midi-file-checker.service';

declare var MIDIjs: any;

@Component({
    selector: 'play-controls',
    templateUrl: './play-controls.component.html',
    styles: ['.draggable {cursor: move; }']
})
export class PlayControlsComponent implements OnChanges {
    song: Song;
    @Input() selectedSongId: string;
    mouseDown: boolean = false;
    isPlaying: boolean = false;
    loadFinished: boolean;

    constructor(private _songService: SongRepositoryService,
        private _midi2JsonService: Midi2JsonService,
        private _songDisplayService: SongDisplayService,
        private _audioControlsService: AudioControlsService,
        private _midiFileCheckerService: MidiFileCheckerService) {
    }


    async ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        this.loadFinished = false;
        for (let propName in changes) {
            let changedProp = changes[propName];
            let from = JSON.stringify(changedProp.previousValue);
            let to = JSON.stringify(changedProp.currentValue);
            if (propName == 'selectedSongId' && to !== '')
                this.GetSongData();
            this.loadFinished = true;
        }
    }
    async GetSongData() {
        if (this.selectedSongId && this.selectedSongId !== '') {
            let songData: any = await (this._songService.getSongById(this.selectedSongId));

            this.song = new Song();
            this.song.name = songData.name;
            this.song._id = this.selectedSongId;
            this.song.band = new Band();
            this.song.band._id = songData.band;
            this.song.band.name = songData.band.name;
            this.song.midiFile = await (this._songService.getSongMidiById(this.selectedSongId));
            this.song.jsonFile = await this._midi2JsonService.getMidiObject(this.song.midiFile);
            this._songDisplayService.songDisplay(this.song.jsonFile);
            this._audioControlsService.Initialize(this.song.jsonFile);
        };
    }
    playSong() {
        if (this.loadFinished) {
            let songPartToPlay: ArrayBuffer = this._audioControlsService.GetSongBytesFromStartingPosition();
           // this.download("midifile.txt", songPartToPlay);
            let check = this._midiFileCheckerService.check(songPartToPlay);
            MIDIjs.play(songPartToPlay);
            this.isPlaying = true;
        }
    }

    pauseSong() {
        if (this.isPlaying) {
            this._songDisplayService.songPaused();
            this._audioControlsService.songPaused()
            MIDIjs.stop();
            this.isPlaying = false;
        }
    }
    stopSong() {
        if (this.isPlaying) {
            this._songDisplayService.songStopped();
            this._audioControlsService.songStopped()
            MIDIjs.stop();
            this.isPlaying = false;
        }
    }

    goToBeginning() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToBeginning();
        }
    }
    goToEnd() {
        if (this.loadFinished && !this.isPlaying) {
            this._audioControlsService.goToEnd();
        }
    }
    zoomIn() {
        this._songDisplayService.changeZoom(1);
    }

    zoomOut() {
        this._songDisplayService.changeZoom(-1);
    }
    moveLeft() {
        this._songDisplayService.moveWindow(-1, 0);
    }
    moveRight() {
        this._songDisplayService.moveWindow(1, 0);
    }
    moveUp() {
        this._songDisplayService.moveWindow(0, -1);
    }
    moveDown() {
        this._songDisplayService.moveWindow(0, 1);
    }

    // used for debugging. Allows to save buffer to disk
    private download(filename, buffer) {
        let base64encoded = Binary2base64.convert(buffer);
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(base64encoded));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    public ProgressControlClicked(evt: MouseEvent) {
        this.mouseDown = true;
    }

    public MoveControl(evt: MouseEvent) {
        if (this.loadFinished && this.mouseDown) {
            this._audioControlsService.MoveControl(evt);
        }
    }

    public MouseUp() {
        this.mouseDown = false;
    }
    @HostListener('PlayStarted')
    MidiSoundStarted() {
        this._audioControlsService.songStarted();
    }
    @HostListener('PlayFinished')
    MidiSoundFinished() {
        this._audioControlsService.songStopped();
    }
}

