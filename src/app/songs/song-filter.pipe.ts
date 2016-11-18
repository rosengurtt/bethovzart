import {  PipeTransform, Pipe } from '@angular/core';
import { Song } from './song';

@Pipe({
    name: 'songFilter'
})
export class SongFilterPipe implements PipeTransform {

    transform(value: Song[], filterBy: string): Song[] {
        filterBy = filterBy ? filterBy.toLocaleLowerCase() : null;
        return filterBy ? value.filter((song: Song) =>
            song.name.toLocaleLowerCase().indexOf(filterBy) !== -1) : value;
    }
}
