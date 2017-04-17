import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

import { AudioControlsEventTypes } from './audio-controls-event-types.enum';
import { AudioControlEvent } from './audio-control-event';

@Injectable()
export class AudioControlsEventsService {
    private subject = new Subject<AudioControlEvent>();

    raiseEvent(eventType: AudioControlsEventTypes, eventData?: any) {
        this.subject.next(new AudioControlEvent(eventType, eventData));
    }

    clearEvents() {
        this.subject.next();
    }

    getEvents(): Observable<AudioControlEvent> {
        return this.subject.asObservable();
    }
}
