import { BethovzartClientPage } from './app.po';

describe('bethovzart-client App', function() {
  let page: BethovzartClientPage;

  beforeEach(() => {
    page = new BethovzartClientPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
