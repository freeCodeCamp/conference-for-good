import { CcawAngcliPage } from './app.po';

describe('ccaw-angcli App', function() {
  let page: CcawAngcliPage;

  beforeEach(() => {
    page = new CcawAngcliPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
