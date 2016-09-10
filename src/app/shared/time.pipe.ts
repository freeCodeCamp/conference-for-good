import { Pipe, PipeTransform } from '@angular/core';
import { DateService } from './date.service';

import * as moment from 'moment';

@Pipe({
  name: 'time'
})
export class TimePipe implements PipeTransform {

  constructor(private dateService: DateService) { }

  transform(value: string): string {
    let valMoment = moment(`2010-10-10 ${value}`, this.dateService.dbFormatTimeDate);
    return valMoment.format(this.dateService.userTimeFormat);
  }
}