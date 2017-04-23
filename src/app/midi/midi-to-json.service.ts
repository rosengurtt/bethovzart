import { Injectable } from '@angular/core';
import { SongJson } from './song-json/song-json';
import { MidiEvent } from './midi-event';
import { Track } from './song-json/track';
import { ConcatenateUint8Array } from '../shared/concatenate-uint8array';

let MIDIFile: any = require('midifile');

@Injectable()
export class Midi2JsonService {

    // Converts from binary midi to json version
    // Uses an external library "midiFile"
    public getMidiObject(readBuffer: ArrayBuffer): SongJson {
        // Creating the MIDIFile instance
        let midiFile = new MIDIFile(readBuffer);
        let format: number = midiFile.header.getFormat(); // 0, 1 or 2
        let ticksPerBeat: number = midiFile.header.getTicksPerBeat();
        let returnObject = new SongJson(format, ticksPerBeat, []);
        let tracksCount: number = midiFile.header.getTracksCount();

        for (let i = 0; i < tracksCount; i++) {
            // The external library "midiFile" produces a json object that is bascically
            // a set of tracks, each containing a sequence of events. 
            // We add an extra property to each event, that is the time in ticks 
            // since the beginning of the song
            returnObject.tracks[i] = this.addTimeSinceBeginningField(midiFile.getTrackEvents(i));
        }
        return returnObject;
    };

    private addTimeSinceBeginningField(track: any): Track {
        let timeSinceBeginning = 0;
        let returnValue: Track = new Track([]);
        for (let i = 0; i < track.length; i++) {
            let event = track[i];
            timeSinceBeginning += event.delta;
            let midiEventItem = new MidiEvent();
            midiEventItem.delta = event.delta;
            midiEventItem.ticksSinceStart = timeSinceBeginning;
            midiEventItem.index = event.index;
            midiEventItem.length = event.length;
            midiEventItem.param1 = event.param1;
            midiEventItem.param2 = event.param2;
            midiEventItem.param3 = event.param3;
            midiEventItem.param4 = event.param4;
            midiEventItem.subtype = event.subtype;
            midiEventItem.type = event.type;
            midiEventItem.data = event.data;
            midiEventItem.tempo = event.tempo;
            midiEventItem.tempoBPM = event.tempoBPM;
            midiEventItem.channel = event.channel;
            midiEventItem.key = event.key;
            midiEventItem.scale = event.scale;
            returnValue.events.push(midiEventItem);
        }
        returnValue.reset();
        return returnValue;
    }

    // converts from json version to binary midi
    public getMidiBytes(midiObject: SongJson) {
        let buffer = this.getMidiHeader(midiObject.tracks.length, midiObject.ticksPerBeat);
        for (let k = 0; k < midiObject.tracks.length; k++) {
            let bufferTrack = this.getMidiTrackBytes(midiObject.tracks[k]);
            buffer = ConcatenateUint8Array.concat(buffer, bufferTrack);
        };
        return buffer;
    }

    private getMidiHeader(tracks, ticksPerBeat): Uint8Array {
        let buffer = new Uint8Array(14);
        buffer[0] = 0x4D;
        buffer[1] = 0x54;
        buffer[2] = 0x68;
        buffer[3] = 0x64;
        buffer[4] = 0x00;
        buffer[5] = 0x00;
        buffer[6] = 0x00;
        buffer[7] = 0x06;
        buffer[8] = 0x00;
        buffer[9] = 0x01;
        buffer[10] = tracks >> 8;
        buffer[11] = tracks & 0xFF;
        buffer[12] = ticksPerBeat >> 8;
        buffer[13] = ticksPerBeat & 0xFF;
        return buffer;
    }

    private getMidiTrackBytes(track: Track): Uint8Array {
        let trackHeaderLength = 8;
        let maxLength = track.events.length * 6 + 30;
        let buffer = new Uint8Array(maxLength);
        // Magic word of Midi File
        buffer[0] = 0x4D;
        buffer[1] = 0x54;
        buffer[2] = 0x72;
        buffer[3] = 0x6B;
        let j = trackHeaderLength; // points to next index in buffer
        // bytes 4 to 7 is the length of the track that we still don't know
        for (let i = 0; i < track.events.length; i++) {
            let deltaLength: number;
            let event = track.events[i];
            let delta: number = event.delta;

            // Delta time calculation. Delta is written in groups of 7 bits, not bytes
            let indexAtBeginningOfEvent = j;
            if (delta > (0x80 * 0x80 * 0x80)) {
                buffer[j++] = (delta >> 21) & 0x7F | 0x80;
            }
            if (delta > (0x80 * 0x80)) {
                buffer[j++] = (delta >> 14) & 0x7F | 0x80;
            }
            if (event.delta > 0x80) {
                buffer[j++] = (delta >> 7) & 0x7F | 0x80;
            }
            buffer[j++] = delta & 0x7F;
            deltaLength = j - indexAtBeginningOfEvent;
            // note on
            if (event.isNoteOn()) {
                buffer[j++] = 0x90 | event.channel;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                continue;
            }
            // note off
            if (event.isNoteOff()) {
                buffer[j++] = 0x80 | event.channel;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                continue;
            }
            // pressure change
            if (event.isPressureChange()) {
                buffer[j++] = 0xD0 | event.channel;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                continue;
            }
            // bending
            if (event.isPitchBend()) {
                buffer[j++] = 0xE0 | event.channel;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                continue;
            }
            // tempo
            if (event.isTempo()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x51;
                buffer[j++] = 0x03;
                let tempo = event.tempo;
                if (tempo > (0x1000000)) {
                    buffer[j++] = (tempo >> 24) & 0xFF;
                }
                if (tempo > 0x10000) {
                    buffer[j++] = (tempo >> 16) & 0xFF;
                }
                if (tempo > 0x100) {
                    buffer[j++] = (tempo >> 8) & 0xFF;
                }
                buffer[j++] = tempo & 0xFF;
                continue;
            }
            // Modulation
            if (event.isModulation()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                continue;
            }
            // Patch change (instrument)
            if (event.isPatchChange()) {
                buffer[j++] = 0xC0 | event.channel;
                buffer[j++] = event.param1;
                continue;
            }
            // Volume change (setea volumen global del track)
            if (event.isVolumeChange()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = 0x07;
                buffer[j++] = event.param2;
                continue;
            }
            // Pan change (setea volumenes relativos de izq y der)
            if (event.isPanChange()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = 0x0A;
                buffer[j++] = event.param2;
                continue;
            }
            // Reset all controllers
            if (event.isResetAllControllers()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = 0x79;
                buffer[j++] = 0x00;
                continue;
            }
            // Effect 1 Depth ( Usually controls reverb send amount)
            if (event.isEffect1Depht()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = 0x5B;
                buffer[j++] = event.param2;
                continue;
            }
            // Effect 3 Depth( Usually controls chorus amount)
            if (event.isEffect3Depht()) {
                buffer[j++] = 0xB0 | event.channel;
                buffer[j++] = 0x5D;
                buffer[j++] = event.param2;
                continue;
            }
            // Midi Port
            if (event.isMidiPort()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x21;
                buffer[j++] = 0x01;
                buffer[j++] = event.data[0];
                continue;
            }
            // Key Signature
            if (event.isKeySignature()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x59;
                buffer[j++] = 0x02;
                buffer[j++] = event.key;
                buffer[j++] = event.scale;
                continue;
            }
            // Time Signature
            if (event.isTimeSignature()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x58;
                buffer[j++] = 0x04;
                buffer[j++] = event.param1;
                buffer[j++] = event.param2;
                buffer[j++] = event.param3;
                buffer[j++] = event.param4;
                continue;
            }
            // End of Track
            if (event.isEndOfTrack() && (i === track.events.length - 1)) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x2F;
                buffer[j++] = 0x00;
                continue;
            }
            // We ignore this event
            j -= deltaLength;
        };
        // End of track
        // Now that we know the track length, save it
        let trackLength = j - trackHeaderLength; // has to substract 8 because the length is measured not from
        // the beginning of the track, but from the first byte after
        // the length bytes
        buffer[4] = this.getNthByteOfInteger(trackLength, 3);
        buffer[5] = this.getNthByteOfInteger(trackLength, 2);
        buffer[6] = this.getNthByteOfInteger(trackLength, 1);
        buffer[7] = this.getNthByteOfInteger(trackLength, 0);
        return buffer.slice(0, trackLength + trackHeaderLength); // The length of the buffer includes the header and the bytes of the length
    }

    private getNthByteOfInteger(integer, n) {
        return Math.floor(integer / (Math.pow(0x100, n))) & 0xFF;
    }


}