import { Pipe, PipeTransform } from '@angular/core';

/**
 * If the value length is below input length, returns the original string.
 * If the value length exceeds input length, slice to input length and add ellipsis.
 */
@Pipe({
  name: 'ellipsis'
})
export class EllipsisPipe implements PipeTransform {
  transform(value: string, length: string): string {
    let cutPoint = parseInt(length);
    if (value.length < cutPoint) return value;
    else return value.slice(0, cutPoint) + '...';
  }
}