import { test, expect } from '../../../core/fixtures/base.fixture';
import { env }          from '../../../../config/environment';

test.describe('Auth infrastructure verification', () => {

  test('TC_AUTH_001 sessionStorage survives route navigation @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/dashboard');
    const before = await page.evaluate(() => sessionStorage.length);

    await page.goto(env.baseUrl + '/contacts');
    const after = await page.evaluate(() => sessionStorage.length);

    expect(after).toBe(before);
  });

});
