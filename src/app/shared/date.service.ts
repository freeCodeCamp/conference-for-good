import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable()
export class DateService {

  userFormatDate = 'MM/DD/YYYY';
  userFormatDateLong = 'dddd MMM Do, YYYY';
  userTimeFormat = 'h:mm A';
  userFormatTimeDate = 'MM/DD/YYYY hh:mm A'

  dbFormatDate = 'YYYY-MM-DD';
  dbFormatTimeDate = 'YYYY-MM-DD HH:mm'

  constructor() { }

  /** 
   * Format date string to the format the database uses
   * @param userDate MM/DD/YYYY
   * @returns YYYY-MM-DD
   */
  formatDateForDatabase(userDate: string): string {
    return moment(userDate, this.userFormatDate, true).format(this.dbFormatDate);
  }

  /** 
   * Format date string to human readable
   * @param dbDate YYYY-MM-DD
   * @returns MM/DD/YYYY
   */
  formatDateForUser(dbDate: string): string {
    return moment(dbDate, this.dbFormatDate, true).format(this.userFormatDate);
  }

  /**
   * Format time and date string to human readable
   * @param dbTimeDate YYYY-MM-DD 24HR:mm
   * @returns MM/DD/YYYY 12hr:mm AM/PM
   */
  formatTimeDateForUser(dbTimeDate: string) {
    return moment(dbTimeDate, this.dbFormatTimeDate, true).format(this.userFormatTimeDate);
  }

}