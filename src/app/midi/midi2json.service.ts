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
            let returnObject = new songJson();

            // Reading headers
            returnObject.format = midiFile.header.getFormat(); // 0, 1 or 2
            returnObject.tracksCount = midiFile.header.getTracksCount();
            returnObject.ticksPerBeat = midiFile.header.getTicksPerBeat();
            returnObject.tracks = [];

            for (var i = 0; i < returnObject.tracksCount; i++) {
                returnObject.tracks[i] = this.addTimeSinceBeginningField(midiFile.getTrackEvents(i));
            }
            resolve(returnObject);
        });
    };

    private addTimeSinceBeginningField(track: midiEvent[]): midiEvent[] {
        let timeSinceBeginning: number = 0;
        for (let i = 0; i < track.length; i++) {
            timeSinceBeginning += track[i].delta;
            track[i].ticksSinceStart = timeSinceBeginning;
        }
        return track;
    }

    //converts from json version to binary midi
    public getMidiBytes(midiObject:songJson) {
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

    private getMidiTrackBytes(track): any {
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
            var eventProcessed = false;
            var deltaLength;
            var delta = track[i].delta;
            var channel = track[i].channel;
            var param1 = track[i].param1;
            var param2 = track[i].param2;
            var param3 = track[i].param3;
            var param4 = track[i].param4;
            var type = track[i].type;
            var subtype = track[i].subtype;

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
            if (type == 8 && subtype == 9) {
                buffer[j++] = 0x90 | channel;
                buffer[j++] = param1;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            //note off
            if (type == 8 && subtype == 8) {
                buffer[j++] = 0x80 | channel;
                buffer[j++] = param1;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            //tempo
            if (type == 255 && subtype == 81) {
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
                eventProcessed = true;
            }
            // Patch change (instrument)
            if (type == 8 && subtype == 12) {
                buffer[j++] = 0xC0 | channel;
                buffer[j++] = param1;
                eventProcessed = true;
            }
            // Volume change (setea volumen global del track)
            if (type == 8 && subtype === 11 && param1 == 7) {
                buffer[j++] = 0xB0 | channel;
                buffer[j++] = 0x07;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            // Pan change (setea volumenes relativos de izq y der)
            if (type == 8 && subtype === 11 && param1 == 10) {
                buffer[j++] = 0xB0 | channel;
                buffer[j++] = 0x0A;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            // Reset all controllers
            if (type == 8 && subtype == 11 && param1 == 121) {
                buffer[j++] = 0xB0 | channel;
                buffer[j++] = 0x79;
                buffer[j++] = 0x00;
                eventProcessed = true;
            }
            // Effect 1 Depth ( Usually controls reverb send amount)
            if (type == 8 && subtype == 11 && param1 == 91) {
                buffer[j++] = 0xB0 | channel;
                buffer[j++] = 0x5B;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            // Effect 3 Depth( Usually controls chorus amount)
            if (type == 8 && subtype == 11 && param1 == 93) {
                buffer[j++] = 0xB0 | channel;
                buffer[j++] = 0x5D;
                buffer[j++] = param2;
                eventProcessed = true;
            }
            // Midi Port
            if (type == 255 && subtype === 33) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x21;
                buffer[j++] = 0x01;
                buffer[j++] = track[i].data[0];
                eventProcessed = true;
            }
            // Key Signature
            if (type == 255 && subtype == 89) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x59;
                buffer[j++] = 0x02;
                buffer[j++] = track[i].key;
                buffer[j++] = track[i].scale;
                eventProcessed = true;
            }
            // Time Signature
            if (type == 255 && subtype == 88) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x58;
                buffer[j++] = 0x04;
                buffer[j++] = param1;
                buffer[j++] = param2;
                buffer[j++] = param3;
                buffer[j++] = param4;
                eventProcessed = true;
            }
            // End of Track
            if (type == 255 && subtype == 47) {
                buffer[j++] = 0xFF;
                buffer[j++] = 0x2F;
                buffer[j++] = 0x00;
                eventProcessed = true;
            }
            if (!eventProcessed) {
                j -= deltaLength;
            }
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