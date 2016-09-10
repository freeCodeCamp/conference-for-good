import { Pipe, PipeTransform } from '@angular/core';
import { DateService } from './date.service';

import * as moment from 'moment';

@Pipe({
  name: 'dateCustom'
})
export class DatePipe implements PipeTransform {

  constructor(private dateService: DateService) { }

  transform(value: string, format: string): string {
    let returnFormat;
    if (format === 'long') returnFormat = this.dateService.userFormatDateLong;
    else returnFormat = this.dateService.userFormatDate;
    let valMoment = moment(`${value}`, this.dateService.dbFormatDate);
    return valMoment.format(returnFormat);
  }
}