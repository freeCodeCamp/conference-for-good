export interface Conference {
  archived: boolean,
  /** Active = displayed in calendar */
  lastActive: boolean,
  /** DefaultConf = associated with speaker submissions */
  defaultConf: boolean,
  title: string,
  /** Date format: 2016-12-30 */
  dateRange: {
    start: string,
    end: string
  };
  days?: {
    /** Date format: 2016-12-30 */
    _id: string,
    date: string,
    timeSlots: TimeSlot[]
  }[],
  rooms?: string[]
}

/** Date format: 2016-12-30 */
export interface TimeSlot {
  _id?: string,
  start: string,
  end: string,
}