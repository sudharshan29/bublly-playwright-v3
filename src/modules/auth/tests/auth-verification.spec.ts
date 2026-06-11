import { test, expect } from '../../../core/fixtures/base.fixture';
import { env }          from '../../../../config/environment';

test.describe('Auth infrastructure verification', () => {

  test('TC_AUTH_001 sessionStorage survives route navigation @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
    // Capture the auth key specifically — the app may add its own keys on each page
    const before = await page.evaluate(() => sessionStorage.getItem('userKey'));

    await page.goto(env.baseUrl + '/contacts', { waitUntil: 'domcontentloaded' });
    const after = await page.evaluate(() => sessionStorage.getItem('userKey'));

    // The injected auth key must survive cross-page navigation
    expect(after).toBe(before);
    expect(after).not.toBeNull();
  });

});
