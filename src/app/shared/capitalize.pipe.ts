import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
  transform(value: any): any {
    if (value) {
      return value.replace(/\b\w/g, symbol => symbol.toUpperCase());
    }
  }
}