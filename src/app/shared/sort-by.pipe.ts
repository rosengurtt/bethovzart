import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sortBy' })
export class SortPipe implements PipeTransform {
    transform(array: any[], args: string): any[] {
        if (!array) {
            return array;
        }
        array.sort((a: any, b: any) => {
            let A: string = a[args];
            let B: string = b[args];
            if (A.toUpperCase() < B.toUpperCase()) {
                return -1;
            } else if (A.toUpperCase() > B.toUpperCase()) {
                return 1;
            } else {
                return 0;
            }
        });
        return array;
    }
}