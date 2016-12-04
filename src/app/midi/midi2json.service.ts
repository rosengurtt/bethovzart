import { Injectable } from '@angular/core';
import { songJson } from './song-json';
import { midiEvent } from './midi-event';
var MIDIFile: any = require('midifile');




@Injectable()
export class Midi2JsonService {

    //converts from binary midi to json version
    public async getMidiObject(readBuffer: ArrayBuffer): Promise<songJson> {
        return new Promise((resolve: (songJson) => void, reject) => {
            // Creating the MIDIFile instance
            let midiFile = new MIDIFile(readBuffer);
            let format: number = midiFile.header.getFormat(); // 0, 1 or 2
            let ticksPerBeat: number = midiFile.header.getTicksPerBeat();
            let returnObject = new songJson(format, ticksPerBeat, []);
            let tracksCount: number = midiFile.header.getTracksCount();

            for (var i = 0; i < tracksCount; i++) {
                returnObject.tracks[i] = this.addTimeSinceBeginningField(midiFile.getTrackEvents(i));
            }
            resolve(returnObject);
        });
    };

    private addTimeSinceBeginningField(track: any): midiEvent[] {
        let timeSinceBeginning: number = 0;
        let returnValue: midiEvent[] = [];
        for (let i = 0; i < track.length; i++) {
            timeSinceBeginning += track[i].delta;
            let midiEventItem = new midiEvent();
            midiEventItem.delta = track[i].delta;
            midiEventItem.ticksSinceStart = timeSinceBeginning;
            midiEventItem.index = track[i].index;
            midiEventItem.length = track[i].length;
            midiEventItem.param1 = track[i].param1;
            midiEventItem.param2 = track[i].param2;
            midiEventItem.param3 = track[i].param3;
            midiEventItem.param4 = track[i].param4;
            midiEventItem.subtype = track[i].subtype;
            midiEventItem.type = track[i].type;
            midiEventItem.data = track[i].data;
            midiEventItem.tempo = track[i].tempo;
            midiEventItem.tempoBPM = track[i].tempoBPM;
            midiEventItem.channel = track[i].channel;
            midiEventItem.key = track[i].key;
            midiEventItem.scale = track[i].scale;
            returnValue.push(midiEventItem);
        }
        return returnValue;
    }

    //converts from json version to binary midi
    public getMidiBytes(midiObject: songJson) {
        let buffer = this.getMidiHeader(midiObject.tracks.length, midiObject.ticksPerBeat);
        for (let k = 0; k < midiObject.tracks.length; k++) {
            var bufferTrack = this.getMidiTrackBytes(midiObject.tracks[k]);
            buffer = this.concatenateUint8Array(buffer, bufferTrack);
        };
        return buffer;
    }

    private getMidiHeader(tracks, ticksPerBeat): any {
        var buffer = new Uint8Array(14);
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

    private getMidiTrackBytes(track: midiEvent[]): any {
        var trackHeaderLength = 8;
        var maxLength = track.length * 6 + 30;
        var buffer = new Uint8Array(maxLength);
        // Magic word of Midi File
        buffer[0] = 0x4D;
        buffer[1] = 0x54;
        buffer[2] = 0x72;
        buffer[3] = 0x6B;
        var j = trackHeaderLength; //points to next index in buffer
        // bytes 4 to 7 is the length of the track that we still don't know
        for (let i = 0; i < track.length; i++) {
            var deltaLength: number;
            var delta: number = track[i].delta;

            //Delta time calculation. Delta is written in groups of 7 bits, not bytes
            var indexAtBeginningOfEvent = j;
            if (delta > (0x80 * 0x80 * 0x80))
                buffer[j++] = (delta >> 21) & 0x7F | 0x80;
            if (delta > (0x80 * 0x80))
                buffer[j++] = (delta >> 14) & 0x7F | 0x80;
            if (track[i].delta > 0x80)
                buffer[j++] = (delta >> 7) & 0x7F | 0x80;
            buffer[j++] = delta & 0x7F;
            deltaLength = j - indexAtBeginningOfEvent;
            //note on
            if (track[i].isNoteOn()) {
                buffer[j++] = 0x90 | track[i].channel;
                buffer[j++] = track[i].param1;
                buffer[j++] = track[i].param2;
                continue;
            }
            //note off
            if (track[i].isNoteOff()) {
                buffer[j++] = 0x80 | track[i].channel;
                buffer[j++] = track[i].param1;
                buffer[j++] = track[i].param2;
                continue;
            }
            //tempo
            if (track[i].isTempo()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x51;
                buffer[j++] = 0x03;
                var tempo = track[i].tempo;
                if (tempo > (0x1000000))
                    buffer[j++] = (tempo >> 24) & 0xFF;
                if (tempo > 0x10000)
                    buffer[j++] = (tempo >> 16) & 0xFF;
                if (tempo > 0x100)
                    buffer[j++] = (tempo >> 8) & 0xFF;
                buffer[j++] = tempo & 0xFF;
                continue;
            }
            // Patch change (instrument)
            if (track[i].isPatchChange()) {
                buffer[j++] = 0xC0 | track[i].channel;
                buffer[j++] = track[i].param1;
                continue;
            }
            // Volume change (setea volumen global del track)
            if (track[i].isVolumeChange()) {
                buffer[j++] = 0xB0 | track[i].channel;
                buffer[j++] = 0x07;
                buffer[j++] = track[i].param2;
                continue;
            }
            // Pan change (setea volumenes relativos de izq y der)
            if (track[i].isPanChange()) {
                buffer[j++] = 0xB0 | track[i].channel;
                buffer[j++] = 0x0A;
                buffer[j++] = track[i].param2;
                continue;
            }
            // Reset all controllers
            if (track[i].isResetAllControllers()) {
                buffer[j++] = 0xB0 | track[i].channel;
                buffer[j++] = 0x79;
                buffer[j++] = 0x00;
                continue;
            }
            // Effect 1 Depth ( Usually controls reverb send amount)
            if (track[i].isEffect1Depht()) {
                buffer[j++] = 0xB0 | track[i].channel;
                buffer[j++] = 0x5B;
                buffer[j++] = track[i].param2;
                continue;
            }
            // Effect 3 Depth( Usually controls chorus amount)
            if (track[i].isEffect3Depht()) {
                buffer[j++] = 0xB0 | track[i].channel;
                buffer[j++] = 0x5D;
                buffer[j++] = track[i].param2;
                continue;
            }
            // Midi Port
            if (track[i].isMidiPort()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x21;
                buffer[j++] = 0x01;
                buffer[j++] = track[i].data[0];
                continue;
            }
            // Key Signature
            if (track[i].isKeySignature()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x59;
                buffer[j++] = 0x02;
                buffer[j++] = track[i].key;
                buffer[j++] = track[i].scale;
                continue;
            }
            // Time Signature
            if (track[i].isTimeSignature()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x58;
                buffer[j++] = 0x04;
                buffer[j++] = track[i].param1;
                buffer[j++] = track[i].param2;
                buffer[j++] = track[i].param3;
                buffer[j++] = track[i].param4;
                continue;
            }
            // End of Track
            if (track[i].isEndOfTrack()) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x2F;
                buffer[j++] = 0x00;
                continue;
            }
            //We ignore this event
            j -= deltaLength;           
        };
        //End of track
        // Now that we know the track length, save it
        var trackLength = j - trackHeaderLength; //has to substract 8 because the length is measured not from
        // the beginning of the track, but from the first byte after
        // the length bytes
        buffer[4] = this.getNthByteOfInteger(trackLength, 3);
        buffer[5] = this.getNthByteOfInteger(trackLength, 2);
        buffer[6] = this.getNthByteOfInteger(trackLength, 1);
        buffer[7] = this.getNthByteOfInteger(trackLength, 0);
        return buffer.slice(0, trackLength + trackHeaderLength); //The length of the buffer includes the header and the bytes of the length
    }

    private getNthByteOfInteger(integer, n) {
        return Math.floor(integer / (Math.pow(0x100, n))) & 0xFF;
    }

    private getNthByteOfTempo(tempo, n) {
        return Math.floor(tempo / (Math.pow(0x80, n))) & 0x7F;
    }

    private toArrayBuffer(buffer) {
        var ab = new ArrayBuffer(buffer.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }
        return ab;
    };

    private concatenateUint8Array(a, b) {
        var c = new Int8Array(a.length + b.length);
        c.set(a);
        c.set(b, a.length);
        return c;
    }

}