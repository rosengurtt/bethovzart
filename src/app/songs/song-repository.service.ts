import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';


@Injectable()
export class SongRepositoryService {
    private _songLibraryUrl = 'http://localhost:3000/api/';

    constructor(private _http: Http) { }

    async getStyles(): Promise<any> {
        return this.getMusicItem('styles');
    }
    async getBands(styleId?: string): Promise<any> {
        if (styleId) {
            return this.getMusicItem('bands/style/' + styleId);
        }
        return this.getMusicItem('bands/all');
    }
    async getSongsForBand(bandId: string): Promise<any> {
        return this.getMusicItem('songs/band/' + bandId);
    }
    async getSongsForStyle(styleId: string): Promise<any> {
        return this.getMusicItem('songs/style/' + styleId);
    }
    async getAllSongs(): Promise<any> {
        return this.getMusicItem('songs/all');
    }
    async getSongMidiById(id: string): Promise<any> {
        let self=this;
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", self._songLibraryUrl + 'songs/midi/' + id, true);

            // Ask for the result as an ArrayBuffer.
            xhr.responseType = "arraybuffer";

            xhr.onload = function (e) {
                resolve(this.response);
            };

            xhr.send();
        });
    }
    async getSongById(id: string): Promise<any> {
        return this.getMusicItem('songs/' + id);
    }

    private async  getMusicItem(path: string): Promise<any> {
        return this._http.get(this._songLibraryUrl + path)
            .map((response: Response) => {
                return response.json()
            }).toPromise();

    }
    private handleError(error: Response) {
        // in a real world app, we may send the server to some remote logging infrastructure
        // instead of just logging it to the console
        console.error(error);
        return Observable.throw(error.json().error || 'Server error');
    }
}
