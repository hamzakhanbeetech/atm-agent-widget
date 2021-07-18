import { FuguWidgetPage } from './app.po';

describe('fugu-widget App', () => {
  let page: FuguWidgetPage;

  beforeEach(() => {
    page = new FuguWidgetPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
