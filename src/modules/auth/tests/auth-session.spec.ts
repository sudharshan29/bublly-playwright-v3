import { test, expect } from '../../../core/fixtures/base.fixture';
import { env }          from '../../../../config/environment';

test.describe('Authenticated session behavior', () => {

  test('TC_AUTH_007 authenticated user can access dashboard @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/dashboard');
    expect(page.url()).not.toContain('login');
    await expect(page.locator('body')).not.toContainText(/sign in|log in/i);
  });

  test('TC_AUTH_008 session persists after page reload @smoke', async ({ page }) => {
    await page.goto(env.baseUrl + '/dashboard', { waitUntil: 'domcontentloaded' });
    const urlBefore = page.url();

    await page.reload({ waitUntil: 'domcontentloaded' });
    // networkidle is unreliable on helpdesk apps with WebSocket connections —
    // wait for a stable dashboard element instead
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible', timeout: 15_000 });

    expect(page.url()).not.toContain('login');
    expect(page.url()).toBe(urlBefore);
  });

});
