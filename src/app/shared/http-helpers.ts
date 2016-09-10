import { Response, Headers, RequestOptions } from '@angular/http';

/** Parse server data to json */
export function parseJson(res: Response) {
  let body;
  try {
    body = res.json();
  } catch (e) {
    // Parsing didn't work
    body = res;
  } 
  return body;
}

/** Log error any errors */
export function handleError(error: Response) {
  let origError = error;
  let errorBody = '';
  try {
    errorBody = error.json();
  } catch (jsonParseError) {
    errorBody = origError.toString();
  }
  let errorParsed = {
    status: error.status,
    statusText: error.statusText,
    errorBody
  };
  console.log(errorParsed);
}

/** Prepare data for posting to server via http */
export function packageForPost(data): httpPackage {
  let body;
  try {
    body = JSON.stringify(data);
  } catch (err) {
    console.log(err, 'data failed to string: ', data);
  }
  let headers = new Headers({ 'Content-Type': 'application/json' });
  let options = new RequestOptions({ headers: headers });
  return {
    body: body,
    opts: options
  };
}

interface httpPackage {
  body: string;
  opts: RequestOptions;
}