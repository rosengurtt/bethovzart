import { Injectable } from '@angular/core';

@Injectable()
export class MidiFileCheckerService {

    // returns OK if no errors, returns a description of errors if it founds any
    public check(buffer: ArrayBuffer): string {
        let returnString = '';
        let midiBuffer = new Uint8Array(buffer);
        returnString += this.checkHeader(midiBuffer);
        let numberOfTracks = this.getNumberOfTracks(midiBuffer);
        returnString += this.checkTracks(midiBuffer, numberOfTracks);
        if (returnString !== '') {
            return returnString;
        }
        for (let i = 0; i < numberOfTracks; i++) {
            returnString += this.checkTrack(midiBuffer, i);
        }
        if (returnString === '') {
            returnString = 'OK';
        }
        return returnString;
    }

    // returns a string with a list of errors. If no errors returns an emtpy string
    private checkHeader(midiBuffer: Uint8Array): string {
        let returnString = '';
        // check that file has magic number 4D 54 68 64  
        if (midiBuffer[0] !== 0x4D ||
            midiBuffer[1] !== 0x54 ||
            midiBuffer[2] !== 0x68 ||
            midiBuffer[3] !== 0x64) {
            returnString += 'Magic number "MThd" is missing';
        }

        // check that the length is 6
        if (midiBuffer[4] !== 0 ||
            midiBuffer[5] !== 0 ||
            midiBuffer[6] !== 0 ||
            midiBuffer[7] !== 0x6) {
            returnString += 'Lenght of header is incorrect';
        }
        // the format type is valid
        if (midiBuffer[8] !== 0 ||
            midiBuffer[9] > 2) {
            returnString += 'Type of midi file is incorrect';
        }
        // check that there is at least one track
        if (midiBuffer[10] === 0 &&
            midiBuffer[11] === 0) {
            returnString += 'There are no tracks in this midi file';
        }

        // check that immediately after the header, starts a track
        if (!this.isTrackHeader(midiBuffer, 14)) {
            returnString += 'There are spurious bytes after the midi file header';
        }
        return returnString;
    }

    private getNumberOfTracks(midiBuffer: Uint8Array): number {
        return midiBuffer[10] * 0x100 + midiBuffer[11];
    }

    // checks that there are as many tracks as the file says, and that they start and finish where they should
    private checkTracks(midiBuffer: Uint8Array, numberOfTracks: number): string {
        let returnString = '';
        let indexOfPreviousTrackStart = 14;
        for (let i = 1; i < numberOfTracks; i++) {
            let indexOfTrackStart = this.getIndexOfTrackStart(midiBuffer, indexOfPreviousTrackStart);
            if (!this.isTrackHeader(midiBuffer, indexOfTrackStart)) {
                returnString += 'Expected a track header corresponding to track ' + i + ' at index ' +
                    indexOfTrackStart + ' but there is none.\n';
                break;
            }
            indexOfPreviousTrackStart = indexOfTrackStart;
        }
        return returnString;
    }
    // checks if the 4 bytes starting at position "index" are the magic number of a track header (MTrk)
    private isTrackHeader(midiBuffer: Uint8Array, index: number): boolean {
        if (midiBuffer[index] !== 0x4D ||
            midiBuffer[index + 1] !== 0x54 ||
            midiBuffer[index + 2] !== 0x72 ||
            midiBuffer[index + 3] !== 0x6B) {
            return false;
        }
        return true;
    }

    // Returns the index or number of bytes to the start of a track from the beginning of the file
    private getIndexOfTrackStart(midiBuffer: Uint8Array, indexOfPreviousTrackStart: number): number {
        let lengthOfPreviousTrack = this.getLength(midiBuffer, indexOfPreviousTrackStart + 4);
        return indexOfPreviousTrackStart + 8 + lengthOfPreviousTrack;
    }

    // Converts the 4 bytes starting in position "index" to a number. Length values in midi files are
    // saved as big endian (msb first)
    private getLength(midiBuffer: Uint8Array, index: number) {
        return midiBuffer[index] * 0x1000000 +
            midiBuffer[index + 1] * 0x10000 +
            midiBuffer[index + 2] * 0x100 +
            midiBuffer[index + 3];
    }



    // checks one track. The i parameter defines which track to check
    // returns a string with a list of errors. If no errors returns an emtpy string
    private checkTrack(midiBuffer: Uint8Array, i: number): string {
        let trackBytes = this.getTrackBytes(midiBuffer, i);
        let trackLength = trackBytes.length;
        try {
            while (trackBytes.length > 0) {
                trackBytes = this.processNextEvent(trackBytes);
            }
        }
        catch (error) {
            let indexOfError = trackLength - trackBytes.length;
            return 'Error in track ' + i + ' at aprox index ' + indexOfError +
                ': ' + error.message;
        }
        return '';
    }

    private getTrackBytes(midiBuffer: Uint8Array, trackNumber: number): Uint8Array {
        let indexOfTrackStart: number;
        if (trackNumber === 0) {
            indexOfTrackStart = 14;
        }
        else {
            let indexOfPreviousTrackStart = 14;
            for (let i = 1; i < trackNumber; i++) {
                indexOfPreviousTrackStart = this.getIndexOfTrackStart(midiBuffer, indexOfPreviousTrackStart);
            }
            indexOfTrackStart = indexOfPreviousTrackStart;
        }
        let length = this.getLength(midiBuffer, indexOfTrackStart + 4);
        let indexOfTrackEnd = indexOfTrackStart + 8 + length;
        return midiBuffer.slice(indexOfTrackStart, indexOfTrackEnd);
    }

    // if it finds a problem with the first event, it raises an exception. Otherwise returns the 
    // array without the bytes of the first event
    private processNextEvent(midiBuffer: Uint8Array): Uint8Array {
        midiBuffer = this.removeDeltaTimeOfFirstEvent(midiBuffer);
        midiBuffer = this.removeFirstEvent(midiBuffer);
        return midiBuffer;
    }

    private removeDeltaTimeOfFirstEvent(midiBuffer: Uint8Array): Uint8Array {
        if (midiBuffer[0] < 0x80) {
            return midiBuffer.slice(1);
        }
        else if (midiBuffer[1] < 0x80) {
            return midiBuffer.slice(2);
        }
        else if (midiBuffer[2] < 0x80) {
            return midiBuffer.slice(3);
        }
        else if (midiBuffer[3] < 0x80) {
            return midiBuffer.slice(4);
        }
        throw new Error('Event has invalid delta time');
    }

    private removeFirstEvent(midiBuffer: Uint8Array): Uint8Array {
        let firstNibble = midiBuffer[0] & 0xF0;
        let eventExpectedLength: number
        if ((firstNibble >= 0x8 && firstNibble <= 0xB) || firstNibble === 0xE) {
            eventExpectedLength = 3;
        }
        else if (firstNibble >= 0x12 && firstNibble <= 0x13) {
            eventExpectedLength = 2;
        }
        else if (midiBuffer[0] === 0xFF) {
            if (midiBuffer.length < 3) {
                throw new Error('Error: meta events should have at least 3 bytes and it has only ' +
                    midiBuffer.length + '\n');
            }
            if (midiBuffer[1] === 0x2F &&
                midiBuffer[2] === 0 && 
                midiBuffer.length > 3) {
                throw new Error('Error: there is a spurious "End of Track" event before the end of the track');
            }
            let dataLength = midiBuffer[2];
            eventExpectedLength = dataLength + 2;
        }


        if (midiBuffer.length < eventExpectedLength) {
            throw new Error('Error: event should have ' + eventExpectedLength +
                ' bytes but it has only ' + midiBuffer.length + '\n');
        }
        return midiBuffer.slice(eventExpectedLength);
    }

}