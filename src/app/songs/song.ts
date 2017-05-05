import { Band } from './band';
import {SongJson} from '../midi/song-json/song-json';

export class Song {
    _id: string;
    name: string;
    band: Band;
    midiFile: ArrayBuffer;
    jsonFile: SongJson;
} 