export interface Speaker {

  // _id field, grabbed from mongoose if speaker existed
  _id?: string;

  // Credentials

  admin: boolean,
  password: string,
  salutation: string,
  nameFirst: string,
  nameLast: string,
  email: string,

  // Speaker information

  status: {
    type: string,
    default: 'pending'
  }, // pending, accepted, denied, notifed: boolean
  statusNotification: boolean,  // After accepting/denying, whether they were notified
  title: string,
  organization: string,
  address1: string, // Do we need line1/line2? or break down to number/street? Account for PO box?
  address2?: string,
  city: string,
  state: string,
  zip: string,
  phoneWork: string,
  phoneCell: string,
  assistantOrCC?: string, // Not sure what this is, not required
  bioWebsite: string, // For website/app, 125 word limit
  bioProgram: string, // For pamphlet/printed program, 60 word limit
  headshot: string, // file handling ourselves (typeform has drag/drop file selection) sanitize extensions after MVP, min/max size
  mediaWilling: boolean,
  costsCoveredByOrg: {  // In form: Travel/Lodging/None check all that apply
    name: string,
    covered: boolean
  }[], 
  speakingFees: string, // Not sure if we need a number? Selectable from dropdown?
  hasPresentedAtCCAWInPast2years: boolean,
  recentSpeakingExp: string,
  speakingReferences: string,  // At least 2
  adminNotes: string,

  // _id's of sessions speaker is involved in
  sessions?: string[]
}

export interface Credentials {
  loggedIn: boolean;
  user: Speaker;
}