import type { Page } from '@playwright/test';
import { env }              from '../../../../../config/environment';
import { TIMEOUTS }         from '../../../../core/constants/timeouts';
import { settingsLocators } from '../locators/settings.locators';

const BASE = `/project/${env.starter.projectId}/settings`;

export class SettingsPage {
  readonly page: Page;
  readonly loc:  ReturnType<typeof settingsLocators>;

  constructor(page: Page) {
    this.page = page;
    this.loc  = settingsLocators(page);
  }

  // ── Navigation ────────────────────────────────────────────────────────
  // Direct URL to /settings redirects to /dashboard in fresh sessions.
  // Must initialize via dashboard → sidebar gear click.

  async openFromDashboard(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.waitForURL(/dashboard/, { timeout: TIMEOUTS.navigation });
    await this.loc.settingsGearIcon.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
    await this.loc.settingsGearIcon.click();
    await this.page.waitForURL(/\/settings/, { timeout: TIMEOUTS.navigation });
    await this.loc.homeHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.navigation });
  }

  // Navigate to a Settings sub-page by expanding the section and clicking the sub-link.
  // Always called after openFromDashboard() or after already being on a /settings/* page.

  async gotoWorkspaceGeneral(): Promise<void> {
    await this._ensureVisible(this.loc.workspaceBtn, this.loc.wsGeneralLink);
    await this.loc.wsGeneralLink.click();
    await this.page.waitForURL(/workspacesettings\/general/, { timeout: TIMEOUTS.navigation });
  }

  async gotoWorkspaceBilling(): Promise<void> {
    await this._ensureVisible(this.loc.workspaceBtn, this.loc.wsBillingLink);
    await this.loc.wsBillingLink.click();
    await this.page.waitForURL(/workspacesettings\/billing/, { timeout: TIMEOUTS.navigation });
  }

  async gotoWorkspaceMembers(): Promise<void> {
    await this._ensureVisible(this.loc.workspaceBtn, this.loc.wsMembersLink);
    await this.loc.wsMembersLink.click();
    await this.page.waitForURL(/workspacesettings\/teammates/, { timeout: TIMEOUTS.navigation });
  }

  async gotoProjectsOverview(): Promise<void> {
    await this._ensureVisible(this.loc.projectsBtn, this.loc.projOverviewLink);
    await this.loc.projOverviewLink.click();
    await this.page.waitForURL(/projectsettings\/general/, { timeout: TIMEOUTS.navigation });
  }

  async gotoProjectsGroups(): Promise<void> {
    await this._ensureVisible(this.loc.projectsBtn, this.loc.projGroupsLink);
    await this.loc.projGroupsLink.click();
    await this.page.waitForURL(/projectsettings\/group/, { timeout: TIMEOUTS.navigation });
  }

  async gotoProjectsTeam(): Promise<void> {
    await this._ensureVisible(this.loc.projectsBtn, this.loc.projTeamLink);
    await this.loc.projTeamLink.click();
    await this.page.waitForURL(/projectsettings\/(team|member)/, { timeout: TIMEOUTS.navigation });
  }

  async gotoOperatingHours(): Promise<void> {
    await this._ensureVisible(this.loc.businessHoursBtn, this.loc.operatingHoursLink);
    await this.loc.operatingHoursLink.click();
    await this.page.waitForURL(/operatinghours/, { timeout: TIMEOUTS.navigation });
  }

  async gotoHolidays(): Promise<void> {
    await this._ensureVisible(this.loc.businessHoursBtn, this.loc.holidaysLink);
    await this.loc.holidaysLink.click();
    await this.page.waitForURL(/holiday/, { timeout: TIMEOUTS.navigation });
  }

  async gotoNotifications(): Promise<void> {
    await this.loc.notificationsBtn.click();
    await this.page.waitForURL(/notificationsettings/, { timeout: TIMEOUTS.navigation });
  }

  async gotoMessageTemplates(): Promise<void> {
    await this.loc.messageTemplatesBtn.click();
    await this.page.waitForURL(/message-template/, { timeout: TIMEOUTS.navigation });
  }

  async gotoWorkflows(): Promise<void> {
    await this.loc.workflowsBtn.click();
    await this.page.waitForURL(/workflows/, { timeout: TIMEOUTS.navigation });
  }

  async gotoAIAssistant(): Promise<void> {
    await this.loc.aiAssistantBtn.click();
    await this.page.waitForURL(/aisettings/, { timeout: TIMEOUTS.navigation });
  }

  // Direct URL helpers — used only when the session is already warm (same-session navigation)
  async gotoDirectUrl(path: string): Promise<void> {
    await this.page.goto(`${BASE}/${path}`);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async _ensureVisible(sectionBtn: ReturnType<typeof settingsLocators>['workspaceBtn'], subItem: ReturnType<typeof settingsLocators>['wsGeneralLink']): Promise<void> {
    // If sub-item already visible, the section is already expanded — no click needed
    const already = await subItem.isVisible().catch(() => false);
    if (!already) {
      await sectionBtn.click();
      await subItem.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
    }
  }
}
