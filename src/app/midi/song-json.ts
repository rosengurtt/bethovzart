import { midiEvent } from './midi-event';
import { notesTrack } from './notes-track';
import { trackRange } from './track-range';
import { trackNote} from './track-note';


export class songJson {
    format: number;
    tracksCount: number;
    ticksPerBeat: number;
    tracks: midiEvent[][];

    //Returns the lowest and highest pitches in a track
    private getTrackRange(t: trackNote[]): trackRange {
        let returnValue = new trackRange(500, 0);
        for (let i = 0; i < t.length; i++) {
            let pitch = t[i].pitch;
            if (pitch < returnValue.minPitch) returnValue.minPitch = pitch;
            if (pitch > returnValue.maxPitch) returnValue.maxPitch = pitch;
        }
        return returnValue;
    }

    //Returns the number of ticks in the whole song
    public getSongDurationInTicks(tracks: notesTrack[]): number {
        let duration: number = 0;
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].notesSequence.length > 0) {
                let trackLength: number = tracks[i].notesSequence.length;
                let lastNote: trackNote = tracks[i].notesSequence[trackLength - 1]
                let timeStartsLastNote: number = lastNote.ticksFromStart;
                let durationLastNote = lastNote.duration;
                let endTrack: number = timeStartsLastNote + durationLastNote;
                if (endTrack > duration) {
                    duration = endTrack;
                }
            }
        }
        return duration;
    }
    public getSongDurationInSeconds(): number {
        let duration: number = 0;
        let tempoEvents = this.getTempoEvents();
        for (let i = 0; i < tempoEvents.length; i++) {
            let tempo: number = tempoEvents[i].tempoBPM;
            let start: number = tempoEvents[i].ticksSinceStart;
            let end: number;
            if (i < tempoEvents.length - 1)
                end = tempoEvents[i + 1].ticksSinceStart;
            else
                end = this.getSongDurationInTicks(this.getNotesSequences());
            duration += ((end - start) / this.ticksPerBeat) / (tempo / 60);
        }
        return duration;
    }
    public getTempoEvents(): midiEvent[] {
        let returnValue: midiEvent[] = [];
        for (let i = 0; i < this.tracks.length; i++) {
            let track = this.tracks[i];
            for (let j = 0; j < track.length; j++) {
                if (track[j].type == 255 && track[j].subtype == 81) {
                    returnValue.push(track[j]);
                }
            }
        }
        return returnValue;
    }
    // Convert the midi tracks that have all sort of events, to tracks that have only notes on and notes off
    // In addition, a 'range' property provides the max and minimum pitch for each track
    public getNotesSequences(): notesTrack[] {
        let musicTracks: notesTrack[] = [];
        for (let k = 0; k < this.tracks.length; k++) {
            let trackNotes = this.getNotes(this.tracks[k]);
            if (trackNotes.length > 0) {
                let range: trackRange = this.getTrackRange(trackNotes);
                musicTracks.push(new notesTrack(trackNotes, range))
            }
        }
        return musicTracks;
    }

    // Used to get the events in a midi track that correspond to notes on and notes off
    public getNotes(midiTrack: midiEvent[]): trackNote[] {
        let noteOn: number = 9;
        let noteOff: number = 8;
        let returnArray: trackNote[] = [];
        let timeSinceStart = 0;
        let trackLength = midiTrack.length;
        for (let i = 0; i < trackLength; i++) {
            let midiEvent = midiTrack[i];
            timeSinceStart += midiEvent.delta;
            //Loof for note one events         
            if (midiEvent.type === 8 && midiEvent.subtype === noteOn) {
                let pitch = midiEvent.param1;
                let duration = 0;
                //Find corresponding note off
                for (let j = i + 1; j < trackLength; j++) {
                    let nextEvent = midiTrack[j];
                    duration += nextEvent.delta;
                    if (nextEvent.type === 8 && nextEvent.subtype === noteOff && nextEvent.param1 === pitch) {
                        //Found the note off, save the point
                        let note = new trackNote(timeSinceStart, pitch, duration);
                        returnArray.push(note);
                        break;
                    }
                }
            }
        }
        return returnArray;
    }
}