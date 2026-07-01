import type { Page } from '@playwright/test';

export function settingsLocators(page: Page) {
  return {
    // ── Sidebar ───────────────────────────────────────────────────────────
    settingsGearIcon: page.locator('[id*="settings"], [data-nextstep*="settings"]').first(),

    // ── Settings nav (left sidebar inside Settings) ───────────────────────
    homeLink:              page.getByRole('complementary').getByText('Home',              { exact: true }),
    workspaceBtn:          page.getByRole('button', { name: 'WorkSpace',       exact: true }),
    projectsBtn:           page.getByRole('button', { name: 'Projects',        exact: true }),
    businessHoursBtn:      page.getByRole('button', { name: 'Business Hours',  exact: true }),
    preferencesBtn:        page.getByRole('button', { name: 'Preferences',     exact: true }),
    notificationsBtn:      page.getByRole('button', { name: 'Notifications',   exact: true }),
    messageTemplatesBtn:   page.getByRole('button', { name: 'Message Templates', exact: true }),
    workflowsBtn:          page.getByRole('button', { name: 'Workflows',       exact: true }),
    aiAssistantBtn:        page.getByRole('button', { name: 'AI Assistant',    exact: true }),
    channelsBtn:           page.getByRole('button', { name: 'Channels',        exact: true }),

    // WorkSpace sub-items (visible when WorkSpace is expanded)
    wsGeneralLink:         page.getByRole('complementary').getByText('General',           { exact: true }),
    wsBillingLink:         page.getByRole('complementary').getByText('Billing',           { exact: true }),
    wsMembersLink:         page.getByRole('complementary').getByText('Members',           { exact: true }),
    wsActivityLogsLink:    page.getByRole('complementary').getByText('Activity logs',     { exact: true }).first(),
    wsArchivedLink:        page.getByRole('complementary').getByText('Archived Projects', { exact: true }),

    // Projects sub-items
    projOverviewLink:      page.getByRole('complementary').getByText('Overview',          { exact: true }),
    projGroupsLink:        page.getByRole('complementary').getByText('Groups',            { exact: true }),
    projTeamLink:          page.getByRole('complementary').getByText('Team',              { exact: true }),

    // Business Hours sub-items
    operatingHoursLink:    page.getByRole('complementary').getByText('Operating Hours',   { exact: true }),
    holidaysLink:          page.getByRole('complementary').getByText('Holidays',          { exact: true }),

    // ── Settings Home page content ────────────────────────────────────────
    homeHeading:           page.getByRole('paragraph').filter({ hasText: /^Home$/ }).first(),
    wsSection:             page.getByRole('paragraph').filter({ hasText: /^WorkSpace$/ }).first(),
    projectsSection:       page.getByRole('paragraph').filter({ hasText: /^Projects$/ }).first(),
    bizHoursSection:       page.getByRole('paragraph').filter({ hasText: /^Business Hours$/ }).first(),

    // ── Home page cards (text appears in card descriptions) ───────────────
    generalCard:           page.getByText('Manage workspace preferences and branding.'),
    billingCard:           page.getByText('View invoices, manage plans, and update payment methods.'),
    membersCard:           page.getByText('Invite, manage, and assign workspace members.'),
    overviewCard:          page.getByText('Configure project settings and defaults.'),
    operatingHoursCard:    page.getByText('Set availability schedules and working hours.'),

    // ── Workspace > General page ──────────────────────────────────────────
    workspaceNameInput:    page.getByRole('textbox').first(),
    saveBtn:               page.getByRole('button', { name: /save/i }).first(),

    // ── Workspace > Members page ──────────────────────────────────────────
    inviteTeammatesBtn:    page.getByRole('button', { name: '+ Invite Teammates' }),
    teammatesTab:          page.getByRole('button', { name: 'Teammates',     exact: true }),
    invitedUsersTab:       page.getByRole('button', { name: 'Invited Users', exact: true }),
    activityLogsTab:       page.getByRole('button', { name: 'Activity Logs', exact: true }),

    // ── Projects > Overview page ──────────────────────────────────────────
    projectSettingsHeading: page.getByRole('paragraph').filter({ hasText: /^Project Settings$/ }),
    projectNameInput:       page.getByRole('textbox', { name: /project name/i }).first(),
    createNewProjectBtn:    page.getByRole('button', { name: '+ Create New Project' }),
    deleteProjectBtn:       page.getByRole('button', { name: 'Delete',       exact: true }),

    // ── Business Hours > Operating Hours page ─────────────────────────────
    operatingHoursHeading:  page.getByRole('paragraph').filter({ hasText: /Operating Hours|Business Hours/i }).first(),

    // ── Notifications page ────────────────────────────────────────────────
    notificationsHeading:   page.getByText('Notification Settings', { exact: false }).or(
                              page.getByRole('heading', { name: /notification/i }).first()
                            ),

    // ── Message Templates page ────────────────────────────────────────────
    messageTemplatesHeading: page.getByText('Message Templates', { exact: false }).first(),
    addTemplateBtn:          page.getByRole('button', { name: /add|create|new template/i }).first(),

    // ── Workflows page ────────────────────────────────────────────────────
    workflowsHeading:       page.getByText('Workflows', { exact: false }).first(),
    createWorkflowBtn:      page.getByRole('button', { name: /create|add|new workflow/i }).first(),

    // ── AI Assistant page ─────────────────────────────────────────────────
    aiAssistantHeading:     page.getByText('AI', { exact: false }).first(),
  };
}

export type SettingsLocators = ReturnType<typeof settingsLocators>;
