/*
  OPEN SOURCE FOR GOOD DIRECTORY SAMPLE CONFIG FILE 

  title: Displayed at the Top and as the WebPage Title
  demoVideo: for the moment it only works with a regular YouTube links.
  liveDemo: address to the Homepage of the Project.
  description: an ES6 Template String with Github Markdown.
               Keep it relatively short, a paragraph tops.
  body: an ES6 Template String with Github Markdown. 
        Please include the license and FreeCodeCamp copyright at the end.

  If the 'liveDemo' or the 'demoVideo' aren't yet available you can 
  exclued them, they just won't be added to the Project's page.
*/

module.exports = {
  title: 'Conference for Good',
  demoVideo: 'https://www.youtube.com/watch?v=9-WgWY2B10E&index=1&list=PLWKjhJtqVAbnQ048Pa8sAqJoVRhx8TJtM',
  liveDemo: '',
  description: `An open source conference management tool. Schedule speakers and workshops, accept speaking proposals, and schedule timeslots.
`,
  body: `
### License

This computer software is licensed under the Open Source [BSD-3-Clause](https://github.com/freeCodeCamp/Mail-for-Good/blob/master/LICENSE.md).

Copyright (c) 2017, freeCodeCamp.
`
};
