import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

import { AudioControlsEvents } from './audio-controls-events.enum';

@Injectable()
export class AudioControlsEventsService {
    private subject = new Subject<any>();

    raiseEvent(eventType: AudioControlsEvents, eventData?: any) {
        this.subject.next({ type: eventType, data: eventData });
    }

    clearEvents() {
        this.subject.next();
    }

    getEvents(): Observable<any> {
        return this.subject.asObservable();
    }
}
