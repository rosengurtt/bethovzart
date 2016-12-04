import { Component, OnInit, Input, OnDestroy } from '@angular/core';

import { Song } from './song';
import { SongRepositoryService } from './song-repository.service';
import { IMusicStyle } from './music-style';
import { Band } from './band';
import { FileUploadService } from '../shared/file-upload.service';
import { SongSearchService } from './song-search.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
    templateUrl: './song-list.component.html',
    styleUrls: ['./song-list.component.css']
})
export class SongListComponent implements OnInit, OnDestroy {
    uploadUrl: string = 'http://localhost:3000/api/uploads';
    pageTitle: string = 'Songs List';
    errorMessage: string;
    styles: IMusicStyle[];
    bands: Band[];
    songs: Song[];
    selectedStyleId: string = '';
    selectedBandId: string = '';
    selectedSongId: string = '';
    selectedFileName: string = '';
    uploadedFile: File;
    uploadResult: string;
    listFilter: string;
    subscription: Subscription;

    constructor(private _songService: SongRepositoryService,
        private _fileUploadService: FileUploadService,
        private songSearchService: SongSearchService) {
        this.subscription = songSearchService.saerchTermAnnounce$.subscribe(
            term => {
                this.listFilter = term;
                this.refreshDropDowns();
            });
    }

    async ngOnInit(): Promise<any> {
        this.refreshDropDowns();
    }

    async selectStyle(styleId: string) {
        this.selectedStyleId = styleId;
        this.selectedBandId = '';
        this.refreshDropDowns();
    }
    async selectBand(bandId: string) {
        this.selectedBandId = bandId;
        this.refreshDropDowns();
    }
    async selectSong(songId: string) {
        this.selectedSongId = songId;
    }

    async refreshDropDowns(): Promise<any> {
        this.styles = (await (this._songService.getStyles())).styles;
        this.bands = (await this._songService.getBands(this.selectedStyleId)).bands;
        if (this.selectedBandId === '' && this.selectedStyleId === '') {
            this.songs = (await this._songService.getAllSongs()).songs;
        }
        else if (this.selectedBandId === '') {
            this.songs = (await this._songService.getSongsForStyle(this.selectedStyleId)).songs;
        }
        else {
            this.songs = (await this._songService.getSongsForBand(this.selectedBandId)).songs;
        }
    }
    fileChange(input: any) {
        this.selectedFileName = input.files[0].name;
        this.uploadedFile=input.files[0];
    }
    async UploadHandler(): Promise<any> {
        let result: any;
        if (!this.uploadedFile) {
            return;
        }
        try {
            result = await this._fileUploadService.upload(this.uploadUrl, this.uploadedFile);
        } catch (error) {
        }
        this.uploadResult = result.Result;
        this.selectedFileName = '';
    }

    ngOnDestroy() {
        // prevent memory leak when component destroyed
        this.subscription.unsubscribe();
    }
}
