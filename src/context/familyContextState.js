import { DEFAULT_GOTIFY_RULES } from '../../shared/notificationEvents';
import { nativePushCapability } from '../hooks/useNativePushNotifications';
import {
  notificationPermission,
  webPushCapability
} from '../hooks/useWebNotifications';

export const EMPTY_RESOURCES = {
  events: [],
  shoppingItems: [],
  tasks: [],
  notes: [],
  meals: [],
  savedRecipes: [],
  rewards: [],
  chatMessages: [],
  familyTree: [],
  dashboardLinks: [],
  trashEvents: [],
  moodCheckins: [],
  dailyRoutines: [],
  savingsGoals: [],
  pocketMoneyTransactions: [],
  schoolItems: [],
  familyPolls: [],
  encouragements: [],
  familyMissions: [],
  familyContacts: [],
  familySettings: [],
  kidProfiles: []
};

export const EMPTY_INTEGRATIONS = {
  bring: { connected: false },
  gotify: {
    connected: false,
    rules: { ...DEFAULT_GOTIFY_RULES }
  },
  ntfy: {
    connected: false,
    rules: { ...DEFAULT_GOTIFY_RULES }
  },
  homeAssistant: {
    connected: false,
    enabled: false,
    selectedEntities: []
  },
  nextcloud: {
    connected: false,
    enabled: false,
    eventSyncEnabled: false,
    backupEnabled: false
  }
};

export const DEFAULT_PUBLIC_ACCESS = {
  directoryEnabled: false,
  demo: null,
  familyTransfer: { allowed: false },
  registration: {
    mode: 'closed',
    allowed: false,
    requiresInvite: false
  }
};

export function initialWebPushState() {
  const capability = webPushCapability();
  return {
    ...capability,
    permission: notificationPermission(),
    loading: true,
    busy: '',
    publicKey: '',
    defaults: {},
    currentDeviceId: '',
    devices: []
  };
}

export function initialNativePushState() {
  const capability = nativePushCapability();
  return {
    ...capability,
    permission: capability.supported ? 'prompt' : 'unsupported',
    loading: capability.supported,
    busy: '',
    serverConfigured: null,
    serverReason: '',
    statusError: '',
    permissionError: '',
    activationError: '',
    activationStep: '',
    defaults: {},
    currentDeviceId: '',
    devices: []
  };
}

export function resourceWithDefaults(resources) {
  return Object.fromEntries(
    Object.keys(EMPTY_RESOURCES).map(key => [
      key,
      Array.isArray(resources?.[key]) ? resources[key] : []
    ])
  );
}
