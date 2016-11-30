import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SongSearchService } from './songs/song-search.service';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';

@Component({
    selector: 'pm-app',
    templateUrl: './app.component.html',
    providers: [SongSearchService]
})
export class AppComponent implements OnInit, OnDestroy {
    term = new FormControl();
    pageTitle: string = 'Acme Product Management';
    sub: Subscription;

    constructor(private songSearchService: SongSearchService) {
    }

    ngOnInit() {
        this.sub = this.term.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .subscribe(
            value => {
                this.songSearchService.announceSearchTerm(value);
            },
            error => console.log(error)
            );
    }

    ngOnDestroy() {
        if (this.sub) { this.sub.unsubscribe(); }
    }

}
