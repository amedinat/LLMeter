export const EVENTS = {
  DASHBOARD_VIEWED: 'dashboard_viewed',
  PROVIDER_ADDED: 'provider_added',
  PROVIDER_REMOVED: 'provider_removed',
  ALERT_CREATED: 'alert_created',
  ALERT_DELETED: 'alert_deleted',
  SETTINGS_VIEWED: 'settings_viewed',
  BILLING_PORTAL_OPENED: 'billing_portal_opened',
  PLAN_CHANGED: 'plan_changed',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
