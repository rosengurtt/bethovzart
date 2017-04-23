import { Instrument } from '../midi-codes/instrument.enum';

export class Channel {
    public instruments: Instrument[];
    public number: number;
    public volume: number[];
    constructor(channelNumber: number) {
        this.number = channelNumber;
    }
}