import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

@Injectable()
export class SongSearchService {
  // Observable string sources
  private searchTermSource = new Subject<string>();
  // Observable string streams
  saerchTermAnnounce$ = this.searchTermSource.asObservable();
  // Service message commands
  announceSearchTerm(term: string) {
    this.searchTermSource.next(term);
  }
}