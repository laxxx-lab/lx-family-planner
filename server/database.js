import fs from 'fs';
import path from 'path';
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual
} from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { nextTaskDueDate } from '../shared/taskRecurrence.js';
import { repairFamiliesWithoutAdmin } from './adminRecovery.js';

const DATABASE_FILE = process.env.DATABASE_FILE
  ? path.resolve(process.env.DATABASE_FILE)
  : path.join(process.cwd(), 'family_planner.sqlite');
const LEGACY_DATABASE_FILE = process.env.LEGACY_DATABASE_FILE
  ? path.resolve(process.env.LEGACY_DATABASE_FILE)
  : path.join(process.cwd(), 'family_db.json');

// Fresh self-hosted installations and isolated browser tests may point SQLite
// at a data directory that does not exist yet. Creating only that parent
// directory is idempotent and avoids a startup failure without touching any
// existing database or user data.
fs.mkdirSync(path.dirname(DATABASE_FILE), { recursive: true, mode: 0o700 });

const RECORD_TYPES = new Set([
  'events',
  'shoppingItems',
  'tasks',
  'notes',
  'meals',
  'savedRecipes',
  'rewards',
  'chatMessages',
  'familyTree',
  'dashboardLinks',
  'trashEvents',
  'moodCheckins',
  'dailyRoutines',
  'savingsGoals',
  'pocketMoneyTransactions',
  'schoolItems',
  'familyPolls',
  'encouragements',
  'familyMissions',
  'familyContacts',
  'familySettings',
  'kidProfiles'
]);

const database = new DatabaseSync(DATABASE_FILE);
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    badge TEXT NOT NULL DEFAULT 'Familie',
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    position TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#2563eb',
    bg_color TEXT NOT NULL DEFAULT '#eff6ff',
    theme TEXT NOT NULL DEFAULT 'light',
    custom_theme_css TEXT NOT NULL DEFAULT '',
    birth_date TEXT NOT NULL DEFAULT '',
    stars INTEGER NOT NULL DEFAULT 0 CHECK(stars >= 0),
    pin_hash TEXT,
    is_managed INTEGER NOT NULL DEFAULT 0
      CHECK(is_managed IN (0, 1)),
    allowed_modules_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS members_family_idx
    ON members(family_id);

  CREATE TABLE IF NOT EXISTS family_records (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (family_id, type, id)
  );

  CREATE INDEX IF NOT EXISTS family_records_lookup_idx
    ON family_records(family_id, type, updated_at);

  CREATE TABLE IF NOT EXISTS family_versions (
    family_id TEXT PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_expiry_idx
    ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_name TEXT NOT NULL DEFAULT 'Dieses Gerät',
    preferences_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(family_id, member_id, endpoint)
  );

  CREATE INDEX IF NOT EXISTS push_subscriptions_family_idx
    ON push_subscriptions(family_id, member_id);

  CREATE TABLE IF NOT EXISTS native_push_devices (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    installation_id TEXT NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android',
    device_name TEXT NOT NULL DEFAULT 'Android-Gerät',
    app_version TEXT NOT NULL DEFAULT '',
    preferences_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(family_id, member_id, installation_id)
  );

  CREATE INDEX IF NOT EXISTS native_push_devices_family_idx
    ON native_push_devices(family_id, member_id);

  CREATE INDEX IF NOT EXISTS native_push_devices_installation_idx
    ON native_push_devices(family_id, installation_id);

  CREATE TABLE IF NOT EXISTS inbox_notifications (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '/',
    priority TEXT NOT NULL DEFAULT 'normal',
    dedupe_key TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    read_at INTEGER,
    UNIQUE(family_id, member_id, dedupe_key)
  );

  CREATE INDEX IF NOT EXISTS inbox_notifications_member_idx
    ON inbox_notifications(family_id, member_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS inbox_notifications_unread_idx
    ON inbox_notifications(family_id, member_id, read_at);

  CREATE TABLE IF NOT EXISTS event_reminder_deliveries (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    event_start_key TEXT NOT NULL,
    reminder_minutes INTEGER NOT NULL,
    delivered_at INTEGER NOT NULL,
    PRIMARY KEY (
      family_id,
      event_id,
      event_start_key,
      reminder_minutes
    )
  );

  CREATE INDEX IF NOT EXISTS event_reminder_deliveries_cleanup_idx
    ON event_reminder_deliveries(delivered_at);

  CREATE TABLE IF NOT EXISTS calendar_subscriptions (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    feed_host TEXT NOT NULL DEFAULT '',
    secret_encrypted TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#2563eb',
    member_id TEXT NOT NULL DEFAULT 'all',
    member_ids_json TEXT NOT NULL DEFAULT '[]',
    household TEXT NOT NULL DEFAULT 'familie',
    kind TEXT NOT NULL DEFAULT 'calendar',
    provider TEXT NOT NULL DEFAULT 'ics',
    sync_mode TEXT NOT NULL DEFAULT 'read',
    enabled INTEGER NOT NULL DEFAULT 1
      CHECK(enabled IN (0, 1)),
    last_synced_at INTEGER,
    last_success_at INTEGER,
    last_error TEXT NOT NULL DEFAULT '',
    event_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS calendar_subscriptions_family_idx
    ON calendar_subscriptions(family_id, enabled, updated_at);

  CREATE TABLE IF NOT EXISTS integrations (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    config_json TEXT NOT NULL DEFAULT '{}',
    secret_encrypted TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (family_id, provider)
  );

  CREATE TABLE IF NOT EXISTS integration_sync_items (
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    item_type TEXT NOT NULL,
    local_id TEXT NOT NULL,
    remote_href TEXT NOT NULL,
    remote_etag TEXT NOT NULL DEFAULT '',
    local_hash TEXT NOT NULL DEFAULT '',
    remote_hash TEXT NOT NULL DEFAULT '',
    last_synced_at INTEGER NOT NULL,
    PRIMARY KEY (family_id, provider, item_type, local_id),
    UNIQUE(family_id, provider, item_type, remote_href)
  );

  CREATE INDEX IF NOT EXISTS integration_sync_items_remote_idx
    ON integration_sync_items(
      family_id, provider, item_type, remote_href
    );

  CREATE TABLE IF NOT EXISTS family_relationships (
    id TEXT PRIMARY KEY,
    requester_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    target_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK(
      relation_type IN ('parent', 'child', 'sibling', 'relative')
    ),
    status TEXT NOT NULL CHECK(
      status IN ('pending', 'accepted', 'declined')
    ),
    requested_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    responded_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    requester_grants_json TEXT NOT NULL DEFAULT '{}',
    target_grants_json TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK(requester_family_id <> target_family_id),
    UNIQUE(requester_family_id, target_family_id)
  );

  CREATE INDEX IF NOT EXISTS family_relationships_requester_idx
    ON family_relationships(requester_family_id, status);

  CREATE INDEX IF NOT EXISTS family_relationships_target_idx
    ON family_relationships(target_family_id, status);

  CREATE TABLE IF NOT EXISTS shared_family_events (
    id TEXT PRIMARY KEY,
    owner_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    created_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    data_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shared_family_event_recipients (
    event_id TEXT NOT NULL REFERENCES shared_family_events(id) ON DELETE CASCADE,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, family_id)
  );

  CREATE INDEX IF NOT EXISTS shared_family_event_family_idx
    ON shared_family_event_recipients(family_id, event_id);

  CREATE TABLE IF NOT EXISTS problem_reports (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    page TEXT NOT NULL DEFAULT '',
    app_version TEXT NOT NULL DEFAULT '',
    client_info TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'open'
      CHECK(status IN ('open', 'resolved')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS problem_reports_family_idx
    ON problem_reports(family_id, status, created_at DESC);

  CREATE TABLE IF NOT EXISTS family_letters (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    sender_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    sender_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    recipient_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    reply_to_id TEXT REFERENCES family_letters(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    CHECK(sender_family_id <> recipient_family_id)
  );

  CREATE INDEX IF NOT EXISTS family_letters_mailbox_idx
    ON family_letters(recipient_family_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS family_letters_thread_idx
    ON family_letters(thread_id, created_at ASC);

  CREATE TABLE IF NOT EXISTS family_letter_reads (
    letter_id TEXT NOT NULL REFERENCES family_letters(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    read_at INTEGER,
    archived_at INTEGER,
    PRIMARY KEY (letter_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS family_chat_guests (
    id TEXT PRIMARY KEY,
    relationship_id TEXT NOT NULL
      REFERENCES family_relationships(id) ON DELETE CASCADE,
    host_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    guest_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    guest_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    invited_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'accepted', 'declined', 'revoked')),
    accepted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK(host_family_id <> guest_family_id),
    UNIQUE(host_family_id, guest_family_id, guest_member_id)
  );

  CREATE INDEX IF NOT EXISTS family_chat_guests_host_idx
    ON family_chat_guests(host_family_id, status, updated_at DESC);

  CREATE INDEX IF NOT EXISTS family_chat_guests_guest_idx
    ON family_chat_guests(guest_family_id, guest_member_id, status);
`);

function applySchemaMigration(version, name, work) {
  const alreadyApplied = database
    .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
    .get(version);
  if (alreadyApplied) return;

  database.exec('BEGIN IMMEDIATE');
  try {
    work();
    database
      .prepare(`
        INSERT INTO schema_migrations(version, name, applied_at)
        VALUES(?, ?, ?)
      `)
      .run(version, name, Date.now());
    database.exec(`PRAGMA user_version = ${Number(version)}`);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

applySchemaMigration(1, 'Haushalt Oma und Opa konfigurierbar', () => {
  const familyColumns = database.prepare('PRAGMA table_info(families)').all();
  if (
    !familyColumns.some(
      column => column.name === 'grandparents_household_enabled'
    )
  ) {
    database.exec(`
      ALTER TABLE families
      ADD COLUMN grandparents_household_enabled INTEGER NOT NULL DEFAULT 1
        CHECK(grandparents_household_enabled IN (0, 1));
    `);
  }
});

applySchemaMigration(2, 'Push-Geräte pro Familienprofil', () => {
  const pushSubscriptionTable = database
    .prepare(`
      SELECT sql FROM sqlite_master
      WHERE type = 'table' AND name = 'push_subscriptions'
    `)
    .get();
  if (
    !pushSubscriptionTable?.sql ||
    !/endpoint\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(
      pushSubscriptionTable.sql
    )
  ) {
    return;
  }
  database.exec(`
    DROP INDEX IF EXISTS push_subscriptions_family_idx;
    ALTER TABLE push_subscriptions RENAME TO push_subscriptions_legacy;
    CREATE TABLE push_subscriptions (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      device_name TEXT NOT NULL DEFAULT 'Dieses Gerät',
      preferences_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(family_id, member_id, endpoint)
    );
    INSERT INTO push_subscriptions(
      id, family_id, member_id, endpoint, p256dh, auth,
      device_name, preferences_json, created_at, updated_at
    )
    SELECT
      id, family_id, member_id, endpoint, p256dh, auth,
      device_name, preferences_json, created_at, updated_at
    FROM push_subscriptions_legacy;
    DROP TABLE push_subscriptions_legacy;
    CREATE INDEX push_subscriptions_family_idx
      ON push_subscriptions(family_id, member_id);
  `);
});

applySchemaMigration(3, 'Verwaltete Profile ohne Anmeldung', () => {
  const memberColumns = database.prepare('PRAGMA table_info(members)').all();
  if (!memberColumns.some(column => column.name === 'is_managed')) {
    database.exec(`
      ALTER TABLE members
      ADD COLUMN is_managed INTEGER NOT NULL DEFAULT 0
        CHECK(is_managed IN (0, 1));
    `);
  }
});

applySchemaMigration(4, 'Familienfreigaben, gemeinsame Termine und Problemberichte', () => {
  const relationshipColumns = database
    .prepare('PRAGMA table_info(family_relationships)')
    .all();
  if (!relationshipColumns.some(column => column.name === 'requester_grants_json')) {
    database.exec(`
      ALTER TABLE family_relationships
      ADD COLUMN requester_grants_json TEXT NOT NULL DEFAULT '{}';
    `);
  }
  if (!relationshipColumns.some(column => column.name === 'target_grants_json')) {
    database.exec(`
      ALTER TABLE family_relationships
      ADD COLUMN target_grants_json TEXT NOT NULL DEFAULT '{}';
    `);
  }
  database.exec(`
    CREATE TABLE IF NOT EXISTS shared_family_events (
      id TEXT PRIMARY KEY,
      owner_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      created_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shared_family_event_recipients (
      event_id TEXT NOT NULL REFERENCES shared_family_events(id) ON DELETE CASCADE,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, family_id)
    );
    CREATE INDEX IF NOT EXISTS shared_family_event_family_idx
      ON shared_family_event_recipients(family_id, event_id);
    CREATE TABLE IF NOT EXISTS problem_reports (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      page TEXT NOT NULL DEFAULT '',
      app_version TEXT NOT NULL DEFAULT '',
      client_info TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open'
        CHECK(status IN ('open', 'resolved')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS problem_reports_family_idx
      ON problem_reports(family_id, status, created_at DESC);
  `);
});

applySchemaMigration(5, 'Gelesene Versionshinweise pro Profil', () => {
  const memberColumns = database.prepare('PRAGMA table_info(members)').all();
  if (!memberColumns.some(column => column.name === 'last_seen_release_version')) {
    database.exec(`
      ALTER TABLE members
      ADD COLUMN last_seen_release_version TEXT NOT NULL DEFAULT '';
    `);
  }
});

applySchemaMigration(6, 'Zuverlässige Terminerinnerungen', () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS event_reminder_deliveries (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL,
      event_start_key TEXT NOT NULL,
      reminder_minutes INTEGER NOT NULL,
      delivered_at INTEGER NOT NULL,
      PRIMARY KEY (
        family_id,
        event_id,
        event_start_key,
        reminder_minutes
      )
    );
    CREATE INDEX IF NOT EXISTS event_reminder_deliveries_cleanup_idx
      ON event_reminder_deliveries(delivered_at);
  `);
});

applySchemaMigration(7, 'Stabile Synchronisationszuordnung für Cloud-Dienste', () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS integration_sync_items (
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      item_type TEXT NOT NULL,
      local_id TEXT NOT NULL,
      remote_href TEXT NOT NULL,
      remote_etag TEXT NOT NULL DEFAULT '',
      local_hash TEXT NOT NULL DEFAULT '',
      remote_hash TEXT NOT NULL DEFAULT '',
      last_synced_at INTEGER NOT NULL,
      PRIMARY KEY (family_id, provider, item_type, local_id),
      UNIQUE(family_id, provider, item_type, remote_href)
    );
    CREATE INDEX IF NOT EXISTS integration_sync_items_remote_idx
      ON integration_sync_items(
        family_id, provider, item_type, remote_href
      );
  `);
});

applySchemaMigration(8, 'Native Android-Push-Geräte pro Profil', () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS native_push_devices (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      installation_id TEXT NOT NULL,
      token TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'android',
      device_name TEXT NOT NULL DEFAULT 'Android-Gerät',
      app_version TEXT NOT NULL DEFAULT '',
      preferences_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(family_id, member_id, installation_id)
    );
    CREATE INDEX IF NOT EXISTS native_push_devices_family_idx
      ON native_push_devices(family_id, member_id);
    CREATE INDEX IF NOT EXISTS native_push_devices_installation_idx
      ON native_push_devices(family_id, installation_id);
  `);
});

applySchemaMigration(9, 'Familienbriefkasten und eingeladene Chatgaeste', () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS family_letters (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      sender_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      recipient_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      reply_to_id TEXT REFERENCES family_letters(id) ON DELETE SET NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      CHECK(sender_family_id <> recipient_family_id)
    );
    CREATE INDEX IF NOT EXISTS family_letters_mailbox_idx
      ON family_letters(recipient_family_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS family_letters_thread_idx
      ON family_letters(thread_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS family_letter_reads (
      letter_id TEXT NOT NULL REFERENCES family_letters(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      read_at INTEGER,
      archived_at INTEGER,
      PRIMARY KEY (letter_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS family_chat_guests (
      id TEXT PRIMARY KEY,
      relationship_id TEXT NOT NULL
        REFERENCES family_relationships(id) ON DELETE CASCADE,
      host_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      guest_family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      guest_member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      invited_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'accepted', 'declined', 'revoked')),
      accepted_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      CHECK(host_family_id <> guest_family_id),
      UNIQUE(host_family_id, guest_family_id, guest_member_id)
    );
    CREATE INDEX IF NOT EXISTS family_chat_guests_host_idx
      ON family_chat_guests(host_family_id, status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS family_chat_guests_guest_idx
      ON family_chat_guests(guest_family_id, guest_member_id, status);
  `);
});

applySchemaMigration(10, 'Sichtbare Module pro Familienprofil', () => {
  const memberColumns = database.prepare('PRAGMA table_info(members)').all();
  if (!memberColumns.some(column => column.name === 'allowed_modules_json')) {
    database.exec(`
      ALTER TABLE members
      ADD COLUMN allowed_modules_json TEXT;
    `);
  }
});

applySchemaMigration(11, 'Sichere Designvariablen pro Familienprofil', () => {
  const memberColumns = database.prepare('PRAGMA table_info(members)').all();
  if (!memberColumns.some(column => column.name === 'custom_theme_css')) {
    database.exec(`
      ALTER TABLE members
      ADD COLUMN custom_theme_css TEXT NOT NULL DEFAULT '';
    `);
  }
});

applySchemaMigration(12, 'Geburtstage pro Familienprofil', () => {
  const memberColumns = database.prepare('PRAGMA table_info(members)').all();
  if (!memberColumns.some(column => column.name === 'birth_date')) {
    database.exec(`
      ALTER TABLE members
      ADD COLUMN birth_date TEXT NOT NULL DEFAULT '';
    `);
  }
});

applySchemaMigration(13, 'Verwaltungszugang fuer gesperrte Familien reparieren', () => {
  repairFamiliesWithoutAdmin(database);
});

applySchemaMigration(14, 'Kalenderquellen fuer Muellabfuhr unterscheiden', () => {
  const columns = database
    .prepare('PRAGMA table_info(calendar_subscriptions)')
    .all();
  if (!columns.some(column => column.name === 'kind')) {
    database.exec(`
      ALTER TABLE calendar_subscriptions
      ADD COLUMN kind TEXT NOT NULL DEFAULT 'calendar';
    `);
  }
});

applySchemaMigration(15, 'CalDAV-Kalenderquellen unterscheiden', () => {
  const columns = database
    .prepare('PRAGMA table_info(calendar_subscriptions)')
    .all();
  if (!columns.some(column => column.name === 'provider')) {
    database.exec(`
      ALTER TABLE calendar_subscriptions
      ADD COLUMN provider TEXT NOT NULL DEFAULT 'ics';
    `);
  }
});

applySchemaMigration(16, 'Optionaler CalDAV-Zwei-Wege-Abgleich', () => {
  const columns = database
    .prepare('PRAGMA table_info(calendar_subscriptions)')
    .all();
  if (!columns.some(column => column.name === 'sync_mode')) {
    database.exec(`
      ALTER TABLE calendar_subscriptions
      ADD COLUMN sync_mode TEXT NOT NULL DEFAULT 'read';
    `);
  }
});

applySchemaMigration(17, 'Mehrere Empfaenger fuer Kalenderquellen', () => {
  const columns = database
    .prepare('PRAGMA table_info(calendar_subscriptions)')
    .all();
  if (!columns.some(column => column.name === 'member_ids_json')) {
    database.exec(`
      ALTER TABLE calendar_subscriptions
      ADD COLUMN member_ids_json TEXT NOT NULL DEFAULT '[]';
    `);
    const update = database.prepare(`
      UPDATE calendar_subscriptions
      SET member_ids_json = ?
      WHERE id = ?
    `);
    database
      .prepare('SELECT id, member_id FROM calendar_subscriptions')
      .all()
      .forEach(row => {
        const memberIds = row.member_id && row.member_id !== 'all'
          ? [row.member_id]
          : [];
        update.run(JSON.stringify(memberIds), row.id);
      });
  }
});

applySchemaMigration(18, 'Papierkorb fuer wiederherstellbare Familieninhalte', () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS recycle_bin_records (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      deleted_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
      deleted_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS recycle_bin_family_idx
      ON recycle_bin_records(family_id, deleted_at DESC);
    CREATE INDEX IF NOT EXISTS recycle_bin_expiry_idx
      ON recycle_bin_records(expires_at);
  `);
});

function withTransaction(work) {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function hashSecret(secret) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(secret), salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifySecret(secret, encodedHash) {
  if (!encodedHash || !encodedHash.includes(':')) return false;
  try {
    const [saltHex, hashHex] = encodedHash.split(':');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(String(secret), Buffer.from(saltHex, 'hex'), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function inferRoleType(legacyRole = '', name = '') {
  const value = `${legacyRole} ${name}`.toLowerCase();
  if (value.includes('haustier')) return 'pet';
  if (value.includes('kind')) return 'child';
  if (value.includes('teen')) return 'teen';
  if (value.includes('groß') || value.includes('oma') || value.includes('opa')) return 'senior';
  if (
    value.includes('eltern') ||
    value.includes('mama') ||
    value.includes('papa') ||
    value.includes('mutter') ||
    value.includes('vater')
  ) {
    return 'adult';
  }
  return 'member';
}

function inferPosition(member = {}) {
  if (member.position) return member.position;
  const value = `${member.role || ''} ${member.name || ''}`.toLowerCase();
  if (value.includes('mama') || value.includes('mutter')) return 'mama';
  if (value.includes('papa') || value.includes('vater')) return 'papa';
  if (value.includes('oma')) return 'oma';
  if (value.includes('opa')) return 'opa';
  if (value.includes('teen')) return 'teenager';
  if (value.includes('kind')) return 'kind';
  if (value.includes('haustier')) return 'haustier';
  return 'familienmitglied';
}

function mapFamilyRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    familyName: row.name,
    familyAvatar: row.avatar,
    badge: row.badge,
    grandparentsHouseholdEnabled:
      Number(row.grandparents_household_enabled ?? 1) === 1,
    isConfigured: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMemberRow(row) {
  if (!row) return null;
  let allowedModules;
  if (row.allowed_modules_json !== null && row.allowed_modules_json !== undefined) {
    try {
      const parsed = JSON.parse(row.allowed_modules_json);
      allowedModules = Array.isArray(parsed) ? parsed : [];
    } catch {
      allowedModules = [];
    }
  }
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    role: row.role,
    position: row.position,
    avatar: row.avatar,
    color: row.color,
    bgColor: row.bg_color,
    theme: row.theme,
    customThemeCss: row.custom_theme_css || '',
    birthDate: row.birth_date || '',
    stars: row.stars,
    hasPin: Boolean(row.pin_hash),
    isManaged: Number(row.is_managed || 0) === 1,
    allowedModules,
    lastSeenReleaseVersion: row.last_seen_release_version || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeRecord(type, record, familyId) {
  const id = String(record?.id || `${type}-${randomUUID()}`);
  return {
    ...(record || {}),
    id,
    familyId
  };
}

function parseRecordRow(row) {
  if (!row) return null;
  try {
    return normalizeRecord(row.type, JSON.parse(row.data_json), row.family_id);
  } catch {
    return {
      id: row.id,
      familyId: row.family_id,
      invalid: true
    };
  }
}

export function getAppMeta(key) {
  return database.prepare('SELECT value FROM app_meta WHERE key = ?').get(key)?.value;
}

export function setAppMeta(key, value) {
  database
    .prepare(`
      INSERT INTO app_meta(key, value) VALUES(?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    .run(key, String(value));
}

export function bumpFamilyVersion(familyId) {
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO family_versions(family_id, version, updated_at)
      VALUES(?, 1, ?)
      ON CONFLICT(family_id) DO UPDATE SET
        version = family_versions.version + 1,
        updated_at = excluded.updated_at
    `)
    .run(familyId, now);
  return getFamilyVersion(familyId);
}

export function getFamilyVersion(familyId) {
  return database
    .prepare('SELECT version FROM family_versions WHERE family_id = ?')
    .get(familyId)?.version || 1;
}

export function listPublicFamilies() {
  const rows = database.prepare(`
    SELECT
      f.id,
      f.name,
      f.avatar,
      f.badge,
      f.created_at,
      f.updated_at,
      COUNT(m.id) AS members_count
    FROM families f
    LEFT JOIN members m
      ON m.family_id = f.id
      AND m.is_managed = 0
    GROUP BY f.id
    ORDER BY f.created_at ASC
  `).all();

  return rows.map(row => ({
    ...mapFamilyRow(row),
    membersCount: Number(row.members_count || 0)
  }));
}

export function countFamilies() {
  return Number(
    database.prepare('SELECT COUNT(*) AS count FROM families').get()?.count || 0
  );
}

export function findFamilyAuthCandidates(reference) {
  const normalized = String(reference || '').trim();
  if (!normalized) return [];

  const exact = database
    .prepare('SELECT * FROM families WHERE id = ?')
    .get(normalized);
  const named = database
    .prepare(`
      SELECT * FROM families
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
      ORDER BY created_at ASC
    `)
    .all(normalized);

  return exact
    ? [exact, ...named.filter(row => row.id !== exact.id)]
    : named;
}

export function getFamily(familyId) {
  return mapFamilyRow(
    database.prepare('SELECT * FROM families WHERE id = ?').get(familyId)
  );
}

export function getFamilyAuthRow(familyId) {
  return database.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
}

export function getMembers(familyId) {
  return database
    .prepare('SELECT * FROM members WHERE family_id = ? ORDER BY created_at ASC')
    .all(familyId)
    .map(mapMemberRow);
}

export function getMember(familyId, memberId) {
  return mapMemberRow(
    database
      .prepare('SELECT * FROM members WHERE family_id = ? AND id = ?')
      .get(familyId, memberId)
  );
}

export function getMemberAuthRow(familyId, memberId) {
  return database
    .prepare('SELECT * FROM members WHERE family_id = ? AND id = ?')
    .get(familyId, memberId);
}

export function createFamily({
  id = `fam-${randomUUID()}`,
  familyName,
  familyAvatar = '',
  badge = 'Familie',
  password,
  members = []
}) {
  const now = Date.now();
  return withTransaction(() => {
    database
      .prepare(`
        INSERT INTO families(id, name, avatar, badge, password_hash, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `)
      .run(id, familyName.trim(), familyAvatar, badge, hashSecret(password), now, now);

    database
      .prepare(`
        INSERT INTO family_versions(family_id, version, updated_at)
        VALUES(?, 1, ?)
      `)
      .run(id, now);

    for (const member of members) {
      insertMember(id, member, now);
    }

    return {
      family: getFamily(id),
      members: getMembers(id)
    };
  });
}

function insertMember(familyId, member, now = Date.now()) {
  const id = String(member.id || `mem-${randomUUID()}`);
  const role = member.role || inferRoleType(member.legacyRole, member.name);
  const position = member.position || inferPosition(member);
  database
    .prepare(`
      INSERT INTO members(
        id, family_id, name, role, position, avatar, color, bg_color,
        theme, custom_theme_css, birth_date, stars, pin_hash, is_managed,
        allowed_modules_json,
        created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      familyId,
      String(member.name || 'Familienmitglied').trim(),
      role,
      position,
      member.avatar || '',
      member.color || '#2563eb',
      member.bgColor || '#eff6ff',
      member.theme || (role === 'child' ? 'adventure' : 'light'),
      member.customThemeCss || '',
      member.birthDate || '',
      Math.max(0, Number(member.stars || 0)),
      member.isManaged ? null : (member.pin ? hashSecret(member.pin) : null),
      member.isManaged ? 1 : 0,
      Array.isArray(member.allowedModules)
        ? JSON.stringify(member.allowedModules)
        : null,
      now,
      now
    );
  return getMember(familyId, id);
}

export function createMember(familyId, member) {
  return withTransaction(() => {
    const created = insertMember(familyId, member);
    bumpFamilyVersion(familyId);
    return created;
  });
}

export function updateMember(familyId, memberId, changes) {
  const existing = getMemberAuthRow(familyId, memberId);
  if (!existing) return null;
  const now = Date.now();
  const nextPinHash = Object.prototype.hasOwnProperty.call(changes, 'pin')
    ? (changes.pin ? hashSecret(changes.pin) : null)
    : existing.pin_hash;
  const nextIsManaged = Object.prototype.hasOwnProperty.call(changes, 'isManaged')
    ? (changes.isManaged ? 1 : 0)
    : Number(existing.is_managed || 0);
  const nextAllowedModules = Object.prototype.hasOwnProperty.call(
    changes,
    'allowedModules'
  )
    ? JSON.stringify(Array.isArray(changes.allowedModules) ? changes.allowedModules : [])
    : existing.allowed_modules_json;

  return withTransaction(() => {
    database
      .prepare(`
        UPDATE members SET
          name = ?,
          role = ?,
          position = ?,
          avatar = ?,
          color = ?,
          bg_color = ?,
          theme = ?,
          custom_theme_css = ?,
          birth_date = ?,
          stars = ?,
          pin_hash = ?,
          is_managed = ?,
          allowed_modules_json = ?,
          updated_at = ?
        WHERE family_id = ? AND id = ?
      `)
      .run(
        changes.name ?? existing.name,
        changes.role ?? existing.role,
        changes.position ?? existing.position,
        changes.avatar ?? existing.avatar,
        changes.color ?? existing.color,
        changes.bgColor ?? existing.bg_color,
        changes.theme ?? existing.theme,
        changes.customThemeCss ?? existing.custom_theme_css,
        changes.birthDate ?? existing.birth_date,
        Math.max(0, Number(changes.stars ?? existing.stars)),
        nextIsManaged ? null : nextPinHash,
        nextIsManaged,
        nextAllowedModules,
        now,
        familyId,
        memberId
      );
    if (nextIsManaged) {
      database
        .prepare(`
          UPDATE sessions
          SET member_id = NULL
          WHERE family_id = ? AND member_id = ?
        `)
        .run(familyId, memberId);
    }
    bumpFamilyVersion(familyId);
    return getMember(familyId, memberId);
  });
}

export function acknowledgeMemberReleaseNotes(
  familyId,
  memberId,
  appVersion
) {
  const now = Date.now();
  const result = database
    .prepare(`
      UPDATE members
      SET last_seen_release_version = ?, updated_at = ?
      WHERE family_id = ? AND id = ?
    `)
    .run(String(appVersion || ''), now, familyId, memberId);
  return result.changes > 0 ? getMember(familyId, memberId) : null;
}

export function createPocketMoneyTransaction(
  familyId,
  memberId,
  transaction
) {
  const existing = getMemberAuthRow(familyId, memberId);
  if (!existing || !['child', 'teen'].includes(existing.role)) {
    const error = new Error('Das ausgewählte Kinderprofil wurde nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }
  const amountCents = Math.trunc(Number(transaction.amountCents || 0));
  const starCost = Math.max(0, Math.trunc(Number(transaction.starCost || 0)));
  if (!amountCents || Math.abs(amountCents) > 1_000_000) {
    const error = new Error('Bitte einen gültigen Taschengeldbetrag eingeben.');
    error.statusCode = 400;
    throw error;
  }
  if (starCost > Number(existing.stars || 0)) {
    const error = new Error('Für diese Umwandlung fehlen noch Sterne.');
    error.statusCode = 409;
    throw error;
  }

  return withTransaction(() => {
    const now = Date.now();
    if (starCost) {
      database
        .prepare(`
          UPDATE members
          SET stars = stars - ?, updated_at = ?
          WHERE family_id = ? AND id = ?
        `)
        .run(starCost, now, familyId, memberId);
    }
    const normalized = normalizeRecord(
      'pocketMoneyTransactions',
      {
        ...transaction,
        memberId,
        amountCents,
        starCost,
        createdAt: Number(transaction.createdAt || now)
      },
      familyId
    );
    database
      .prepare(`
        INSERT INTO family_records(
          family_id, type, id, data_json, created_at, updated_at
        )
        VALUES(?, 'pocketMoneyTransactions', ?, ?, ?, ?)
      `)
      .run(
        familyId,
        normalized.id,
        JSON.stringify(normalized),
        now,
        now
      );
    bumpFamilyVersion(familyId);
    return {
      transaction: normalized,
      member: getMember(familyId, memberId)
    };
  });
}

export function deleteMember(familyId, memberId) {
  return withTransaction(() => {
    const result = database
      .prepare('DELETE FROM members WHERE family_id = ? AND id = ?')
      .run(familyId, memberId);
    if (result.changes > 0) bumpFamilyVersion(familyId);
    return result.changes > 0;
  });
}

export function updateFamily(familyId, changes) {
  const existing = getFamilyAuthRow(familyId);
  if (!existing) return null;
  const nextPasswordHash = changes.password
    ? hashSecret(changes.password)
    : existing.password_hash;
  const now = Date.now();

  return withTransaction(() => {
    database
      .prepare(`
        UPDATE families SET
          name = ?,
          avatar = ?,
          badge = ?,
          grandparents_household_enabled = ?,
          password_hash = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .run(
        changes.familyName ?? existing.name,
        changes.familyAvatar ?? existing.avatar,
        changes.badge ?? existing.badge,
        changes.grandparentsHouseholdEnabled === undefined
          ? Number(existing.grandparents_household_enabled ?? 1)
          : changes.grandparentsHouseholdEnabled
            ? 1
            : 0,
        nextPasswordHash,
        now,
        familyId
      );
    bumpFamilyVersion(familyId);
    return getFamily(familyId);
  });
}

export function deleteFamily(familyId) {
  const connectedFamilyIds = database
    .prepare(`
      SELECT requester_family_id, target_family_id
      FROM family_relationships
      WHERE requester_family_id = ? OR target_family_id = ?
    `)
    .all(familyId, familyId)
    .map(row =>
      row.requester_family_id === familyId
        ? row.target_family_id
        : row.requester_family_id
    );

  return withTransaction(() => {
    const deleted = database
      .prepare('DELETE FROM families WHERE id = ?')
      .run(familyId).changes > 0;
    if (deleted) {
      [...new Set(connectedFamilyIds)].forEach(bumpFamilyVersion);
    }
    return deleted;
  });
}

function transferRecordData(value, sourceFamilyId, targetFamilyId) {
  if (Array.isArray(value)) {
    return value.map(entry =>
      transferRecordData(entry, sourceFamilyId, targetFamilyId)
    );
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key === 'familyId' && entry === sourceFamilyId
        ? targetFamilyId
        : transferRecordData(entry, sourceFamilyId, targetFamilyId)
    ])
  );
}

function parseTransferRecord(type, row, sourceFamilyId, targetFamilyId) {
  assertRecordType(type);
  const parsed = JSON.parse(String(row?.dataJson || row?.data_json || '{}'));
  const record = transferRecordData(parsed, sourceFamilyId, targetFamilyId);
  return {
    id: String(row?.id || record?.id || ''),
    dataJson: JSON.stringify({ ...record, id: String(row?.id || record?.id), familyId: targetFamilyId }),
    createdAt: Number(row?.createdAt || row?.created_at || Date.now()),
    updatedAt: Number(row?.updatedAt || row?.updated_at || Date.now())
  };
}

/**
 * Creates the portable, server-independent part of one family. Secrets for
 * cloud, CalDAV, Home Assistant and push devices deliberately stay behind:
 * they are encrypted with this server's key or tied to a particular device.
 */
export function exportFamilyTransferData(familyId) {
  const family = database
    .prepare('SELECT * FROM families WHERE id = ?')
    .get(familyId);
  if (!family) return null;
  const rows = database.prepare(`
    SELECT type, id, data_json, created_at, updated_at
    FROM family_records
    WHERE family_id = ?
    ORDER BY created_at ASC
  `).all(familyId);
  const recycled = database.prepare(`
    SELECT id, record_type, record_id, data_json, deleted_by_member_id,
      deleted_at, expires_at
    FROM recycle_bin_records
    WHERE family_id = ?
    ORDER BY deleted_at ASC
  `).all(familyId);
  const members = database.prepare(`
    SELECT id, name, role, position, avatar, color, bg_color, theme,
      custom_theme_css, birth_date, stars, pin_hash, is_managed,
      allowed_modules_json, last_seen_release_version, created_at, updated_at
    FROM members
    WHERE family_id = ?
    ORDER BY created_at ASC
  `).all(familyId);

  return {
    format: 'lx-family-transfer',
    version: 1,
    exportedAt: Date.now(),
    family: {
      id: family.id,
      name: family.name,
      avatar: family.avatar,
      badge: family.badge,
      passwordHash: family.password_hash,
      grandparentsHouseholdEnabled:
        Number(family.grandparents_household_enabled ?? 1) === 1,
      createdAt: family.created_at,
      updatedAt: family.updated_at
    },
    members: members.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      position: member.position,
      avatar: member.avatar,
      color: member.color,
      bgColor: member.bg_color,
      theme: member.theme,
      customThemeCss: member.custom_theme_css,
      birthDate: member.birth_date,
      stars: member.stars,
      pinHash: member.pin_hash,
      isManaged: Number(member.is_managed) === 1,
      allowedModulesJson: member.allowed_modules_json,
      lastSeenReleaseVersion: member.last_seen_release_version,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    })),
    records: rows.map(row => ({
      type: row.type,
      id: row.id,
      dataJson: row.data_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })),
    recycleBin: recycled.map(row => ({
      id: row.id,
      type: row.record_type,
      recordId: row.record_id,
      dataJson: row.data_json,
      deletedByMemberId: row.deleted_by_member_id,
      deletedAt: row.deleted_at,
      expiresAt: row.expires_at
    })),
    reconnectRequired: [
      'Family Cloud und andere WebDAV-/Nextcloud-Verbindungen',
      'CalDAV-Kalenderquellen',
      'Home Assistant, Bring, Gotify und ntfy',
      'Browser- und Android-Benachrichtigungen'
    ]
  };
}

export function importFamilyTransferData(payload) {
  const family = payload?.family;
  const familyId = String(family?.id || '').trim();
  const familyName = String(family?.name || '').trim();
  const passwordHash = String(family?.passwordHash || '');
  const members = Array.isArray(payload?.members) ? payload.members : [];
  const records = Array.isArray(payload?.records) ? payload.records : [];
  const recycled = Array.isArray(payload?.recycleBin) ? payload.recycleBin : [];
  if (!familyId || !familyName || !passwordHash.includes(':')) {
    const error = new Error('Die Umzugsdatei enthält keine gültige Familie.');
    error.statusCode = 400;
    throw error;
  }
  if (getFamily(familyId)) {
    const error = new Error('Diese Familie ist auf diesem Server bereits vorhanden.');
    error.statusCode = 409;
    throw error;
  }
  if (!members.length || members.length > 50 || records.length > 100_000) {
    const error = new Error('Die Umzugsdatei enthält zu viele oder keine gültigen Familieninhalte.');
    error.statusCode = 400;
    throw error;
  }
  if (!members.some(member => ['adult', 'senior'].includes(member?.role))) {
    const error = new Error('Die Umzugsdatei enthält kein Erwachsenenprofil.');
    error.statusCode = 400;
    throw error;
  }
  const duplicateMember = members.find(member =>
    !member?.id || database.prepare('SELECT 1 FROM members WHERE id = ?').get(member.id)
  );
  if (duplicateMember) {
    const error = new Error('Ein Profil aus der Umzugsdatei existiert auf diesem Server bereits.');
    error.statusCode = 409;
    throw error;
  }

  const importedAt = Date.now();
  return withTransaction(() => {
    database.prepare(`
      INSERT INTO families(
        id, name, avatar, badge, password_hash, grandparents_household_enabled,
        created_at, updated_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      familyId,
      familyName.slice(0, 100),
      String(family.avatar || '').slice(0, 1_200_000),
      String(family.badge || 'Familie').slice(0, 60),
      passwordHash,
      family.grandparentsHouseholdEnabled === false ? 0 : 1,
      Number(family.createdAt || importedAt),
      importedAt
    );
    database.prepare(`
      INSERT INTO family_versions(family_id, version, updated_at)
      VALUES(?, 1, ?)
    `).run(familyId, importedAt);

    const insertMemberTransfer = database.prepare(`
      INSERT INTO members(
        id, family_id, name, role, position, avatar, color, bg_color, theme,
        custom_theme_css, birth_date, stars, pin_hash, is_managed,
        allowed_modules_json, last_seen_release_version, created_at, updated_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    members.forEach(member => {
      insertMemberTransfer.run(
        String(member.id), familyId,
        String(member.name || 'Familienmitglied').slice(0, 80),
        String(member.role || 'member'), String(member.position || 'familienmitglied'),
        String(member.avatar || '').slice(0, 1_200_000),
        String(member.color || '#2563eb'), String(member.bgColor || '#eff6ff'),
        String(member.theme || 'light'), String(member.customThemeCss || ''),
        String(member.birthDate || ''), Math.max(0, Number(member.stars || 0)),
        member.isManaged ? null : (member.pinHash || null),
        member.isManaged ? 1 : 0,
        typeof member.allowedModulesJson === 'string' ? member.allowedModulesJson : null,
        '', Number(member.createdAt || importedAt), importedAt
      );
    });

    const insertRecord = database.prepare(`
      INSERT INTO family_records(family_id, type, id, data_json, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?)
    `);
    records.forEach(row => {
      const record = parseTransferRecord(row?.type, row, familyId, familyId);
      if (!record.id) throw new Error('Ein Eintrag der Umzugsdatei ist unvollständig.');
      insertRecord.run(familyId, String(row.type), record.id, record.dataJson, record.createdAt, record.updatedAt);
    });

    const insertRecycle = database.prepare(`
      INSERT INTO recycle_bin_records(
        id, family_id, record_type, record_id, data_json, deleted_by_member_id,
        deleted_at, expires_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
    recycled.slice(0, 20_000).forEach(entry => {
      const record = parseTransferRecord(entry?.type, {
        id: entry.recordId,
        dataJson: entry.dataJson,
        createdAt: entry.deletedAt,
        updatedAt: entry.deletedAt
      }, familyId, familyId);
      if (!entry?.id || !record.id) return;
      insertRecycle.run(
        String(entry.id), familyId, String(entry.type), record.id, record.dataJson,
        members.some(member => member.id === entry.deletedByMemberId)
          ? entry.deletedByMemberId
          : null,
        Number(entry.deletedAt || importedAt), Number(entry.expiresAt || importedAt)
      );
    });

    return {
      family: getFamily(familyId),
      members: getMembers(familyId),
      records: records.length
    };
  });
}

export function assertRecordType(type) {
  if (!RECORD_TYPES.has(type)) {
    const error = new Error(`Unbekannter Datentyp: ${type}`);
    error.statusCode = 404;
    throw error;
  }
}

export function listRecords(familyId, type) {
  assertRecordType(type);
  return database
    .prepare(`
      SELECT * FROM family_records
      WHERE family_id = ? AND type = ?
      ORDER BY created_at ASC
    `)
    .all(familyId, type)
    .map(parseRecordRow);
}

export function getRecord(familyId, type, id) {
  assertRecordType(type);
  return parseRecordRow(
    database
      .prepare(`
        SELECT * FROM family_records
        WHERE family_id = ? AND type = ? AND id = ?
      `)
      .get(familyId, type, id)
  );
}

export function createRecord(familyId, type, record) {
  assertRecordType(type);
  const normalized = normalizeRecord(type, record, familyId);
  const now = Date.now();
  return withTransaction(() => {
    database
      .prepare(`
        INSERT INTO family_records(
          family_id, type, id, data_json, created_at, updated_at
        )
        VALUES(?, ?, ?, ?, ?, ?)
      `)
      .run(
        familyId,
        type,
        normalized.id,
        JSON.stringify(normalized),
        now,
        now
      );
    bumpFamilyVersion(familyId);
    return normalized;
  });
}

export function upsertRecord(familyId, type, record, { bump = true } = {}) {
  assertRecordType(type);
  const normalized = normalizeRecord(type, record, familyId);
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO family_records(
        family_id, type, id, data_json, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT(family_id, type, id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `)
    .run(
      familyId,
      type,
      normalized.id,
      JSON.stringify(normalized),
      now,
      now
    );
  if (bump) bumpFamilyVersion(familyId);
  return normalized;
}

export function upsertRecords(familyId, type, records) {
  assertRecordType(type);
  return withTransaction(() => {
    const saved = records.map(record =>
      upsertRecord(familyId, type, record, { bump: false })
    );
    if (saved.length) bumpFamilyVersion(familyId);
    return saved;
  });
}

export function updateRecord(familyId, type, id, changes) {
  const existing = getRecord(familyId, type, id);
  if (!existing) return null;
  return withTransaction(() => {
    const updated = upsertRecord(
      familyId,
      type,
      {
        ...existing,
        ...(changes || {}),
        id,
        familyId
      },
      { bump: false }
    );
    bumpFamilyVersion(familyId);
    return updated;
  });
}

export function deleteRecord(familyId, type, id) {
  assertRecordType(type);
  return withTransaction(() => {
    const result = database
      .prepare(`
        DELETE FROM family_records
        WHERE family_id = ? AND type = ? AND id = ?
      `)
      .run(familyId, type, id);
    if (result.changes > 0) bumpFamilyVersion(familyId);
    return result.changes > 0;
  });
}

const RECYCLE_BIN_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function purgeExpiredRecycledRecords(familyId = '') {
  const statement = familyId
    ? database.prepare(`
      DELETE FROM recycle_bin_records
      WHERE family_id = ? AND expires_at <= ?
    `)
    : database.prepare('DELETE FROM recycle_bin_records WHERE expires_at <= ?');
  return familyId
    ? statement.run(familyId, Date.now()).changes
    : statement.run(Date.now()).changes;
}

export function archiveRecord(familyId, type, id, { deletedByMemberId = null } = {}) {
  assertRecordType(type);
  const now = Date.now();
  return withTransaction(() => {
    purgeExpiredRecycledRecords(familyId);
    const row = database.prepare(`
      SELECT data_json FROM family_records
      WHERE family_id = ? AND type = ? AND id = ?
    `).get(familyId, type, id);
    if (!row) return null;

    const recycleId = `recycle-${randomUUID()}`;
    database.prepare(`
      INSERT INTO recycle_bin_records(
        id, family_id, record_type, record_id, data_json,
        deleted_by_member_id, deleted_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recycleId,
      familyId,
      type,
      id,
      row.data_json,
      deletedByMemberId || null,
      now,
      now + RECYCLE_BIN_RETENTION_MS
    );
    database.prepare(`
      DELETE FROM family_records
      WHERE family_id = ? AND type = ? AND id = ?
    `).run(familyId, type, id);
    bumpFamilyVersion(familyId);
    return {
      id: recycleId,
      type,
      record: JSON.parse(row.data_json),
      deletedAt: now,
      expiresAt: now + RECYCLE_BIN_RETENTION_MS
    };
  });
}

export function listRecycledRecords(familyId) {
  return withTransaction(() => {
    purgeExpiredRecycledRecords(familyId);
    return database.prepare(`
      SELECT * FROM recycle_bin_records
      WHERE family_id = ?
      ORDER BY deleted_at DESC
      LIMIT 250
    `).all(familyId).map(row => ({
      id: row.id,
      type: row.record_type,
      recordId: row.record_id,
      record: JSON.parse(row.data_json),
      deletedByMemberId: row.deleted_by_member_id || '',
      deletedAt: Number(row.deleted_at),
      expiresAt: Number(row.expires_at)
    }));
  });
}

export function restoreRecycledRecord(familyId, recycleId) {
  return withTransaction(() => {
    purgeExpiredRecycledRecords(familyId);
    const row = database.prepare(`
      SELECT * FROM recycle_bin_records
      WHERE family_id = ? AND id = ?
    `).get(familyId, recycleId);
    if (!row) return { status: 'missing' };

    const exists = database.prepare(`
      SELECT 1 FROM family_records
      WHERE family_id = ? AND type = ? AND id = ?
    `).get(familyId, row.record_type, row.record_id);
    if (exists) return { status: 'conflict' };

    const now = Date.now();
    database.prepare(`
      INSERT INTO family_records(
        family_id, type, id, data_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      familyId,
      row.record_type,
      row.record_id,
      row.data_json,
      now,
      now
    );
    database.prepare('DELETE FROM recycle_bin_records WHERE id = ?').run(recycleId);
    bumpFamilyVersion(familyId);
    return {
      status: 'restored',
      type: row.record_type,
      record: JSON.parse(row.data_json)
    };
  });
}

export function permanentlyDeleteRecycledRecord(familyId, recycleId) {
  return withTransaction(() => {
    purgeExpiredRecycledRecords(familyId);
    return database.prepare(`
      DELETE FROM recycle_bin_records
      WHERE family_id = ? AND id = ?
    `).run(familyId, recycleId).changes > 0;
  });
}

export function deleteTaskRecords(
  familyId,
  { memberId = '', completedOnly = false } = {}
) {
  const tasks = listRecords(familyId, 'tasks');
  const deleteIds = tasks
    .filter(task => !memberId || task.memberId === memberId)
    .filter(task => !completedOnly || Boolean(task.completed))
    .map(task => task.id);

  return withTransaction(() => {
    const remove = database.prepare(`
      DELETE FROM family_records
      WHERE family_id = ? AND type = 'tasks' AND id = ?
    `);
    deleteIds.forEach(id => remove.run(familyId, id));
    if (deleteIds.length) bumpFamilyVersion(familyId);
    return {
      deleted: deleteIds.length,
      records: listRecords(familyId, 'tasks')
    };
  });
}

function relationshipFamilySummary(row, prefix) {
  return {
    id: row[`${prefix}_id`],
    familyName: row[`${prefix}_name`],
    familyAvatar: row[`${prefix}_avatar`],
    badge: row[`${prefix}_badge`],
    membersCount: Number(row[`${prefix}_members_count`] || 0)
  };
}

const DEFAULT_RELATIONSHIP_GRANTS = Object.freeze({
  sharedCalendar: true,
  tasks: false,
  rewards: false,
  pocketMoney: false
});

function parseJsonObject(value, fallback = {}) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function normalizeRelationshipGrants(value = {}) {
  const input = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_RELATIONSHIP_GRANTS).map(([key, fallback]) => [
      key,
      Object.hasOwn(input, key) ? Boolean(input[key]) : fallback
    ])
  );
}

function relationshipMemberSummaries(familyId) {
  return getMembers(familyId)
    .filter(member => !member.isManaged)
    .map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
    position: member.position,
    avatar: member.avatar,
    color: member.color,
    bgColor: member.bgColor
    }));
}

function mapRelationshipRow(row, familyId) {
  if (!row) return null;
  const requesterFamily = relationshipFamilySummary(row, 'requester');
  const targetFamily = relationshipFamilySummary(row, 'target');
  if (row.status === 'accepted') {
    requesterFamily.members = relationshipMemberSummaries(
      requesterFamily.id
    );
    targetFamily.members = relationshipMemberSummaries(targetFamily.id);
  } else {
    requesterFamily.members = [];
    targetFamily.members = [];
  }
  const requesterGrants = normalizeRelationshipGrants(
    parseJsonObject(row.requester_grants_json)
  );
  const targetGrants = normalizeRelationshipGrants(
    parseJsonObject(row.target_grants_json)
  );
  const currentIsRequester = row.requester_family_id === familyId;
  return {
    id: row.id,
    relationType: row.relation_type,
    status: row.status,
    direction: row.requester_family_id === familyId ? 'outgoing' : 'incoming',
    requesterFamily,
    targetFamily,
    otherFamily:
      currentIsRequester ? targetFamily : requesterFamily,
    grantsToOther: currentIsRequester ? requesterGrants : targetGrants,
    grantsFromOther: currentIsRequester ? targetGrants : requesterGrants,
    requestedByMemberId: row.requested_by_member_id,
    respondedByMemberId: row.responded_by_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const RELATIONSHIP_SELECT = `
  SELECT
    relationship.*,
    requester.id AS requester_id,
    requester.name AS requester_name,
    requester.avatar AS requester_avatar,
    requester.badge AS requester_badge,
    (
      SELECT COUNT(*) FROM members
      WHERE family_id = requester.id AND is_managed = 0
    ) AS requester_members_count,
    target.id AS target_id,
    target.name AS target_name,
    target.avatar AS target_avatar,
    target.badge AS target_badge,
    (
      SELECT COUNT(*) FROM members
      WHERE family_id = target.id AND is_managed = 0
    ) AS target_members_count
  FROM family_relationships relationship
  JOIN families requester ON requester.id = relationship.requester_family_id
  JOIN families target ON target.id = relationship.target_family_id
`;

export function listFamilyRelationships(familyId) {
  return database
    .prepare(`
      ${RELATIONSHIP_SELECT}
      WHERE (
        relationship.requester_family_id = ?
        OR relationship.target_family_id = ?
      )
      AND relationship.status <> 'declined'
      ORDER BY relationship.created_at DESC
    `)
    .all(familyId, familyId)
    .map(row => mapRelationshipRow(row, familyId));
}

export function getFamilyRelationship(familyId, relationshipId) {
  const row = database
    .prepare(`
      ${RELATIONSHIP_SELECT}
      WHERE relationship.id = ?
        AND (
          relationship.requester_family_id = ?
          OR relationship.target_family_id = ?
        )
    `)
    .get(relationshipId, familyId, familyId);
  return mapRelationshipRow(row, familyId);
}

export function updateFamilyRelationshipGrants(
  familyId,
  relationshipId,
  changes
) {
  const existing = database
    .prepare(`
      SELECT * FROM family_relationships
      WHERE id = ?
        AND status = 'accepted'
        AND (requester_family_id = ? OR target_family_id = ?)
    `)
    .get(relationshipId, familyId, familyId);
  if (!existing) return null;

  const currentIsRequester = existing.requester_family_id === familyId;
  const column = currentIsRequester
    ? 'requester_grants_json'
    : 'target_grants_json';
  const current = normalizeRelationshipGrants(
    parseJsonObject(existing[column])
  );
  const next = normalizeRelationshipGrants({
    ...current,
    ...(changes || {})
  });
  database
    .prepare(`
      UPDATE family_relationships
      SET ${column} = ?, updated_at = ?
      WHERE id = ?
    `)
    .run(JSON.stringify(next), Date.now(), relationshipId);
  bumpFamilyVersion(existing.requester_family_id);
  bumpFamilyVersion(existing.target_family_id);
  return getFamilyRelationship(familyId, relationshipId);
}

export function relationshipAllows(
  ownerFamilyId,
  otherFamilyId,
  permission
) {
  const existing = database
    .prepare(`
      SELECT * FROM family_relationships
      WHERE status = 'accepted'
        AND (
          (requester_family_id = ? AND target_family_id = ?)
          OR
          (requester_family_id = ? AND target_family_id = ?)
        )
    `)
    .get(
      ownerFamilyId,
      otherFamilyId,
      otherFamilyId,
      ownerFamilyId
    );
  if (!existing) return false;
  const grants = normalizeRelationshipGrants(
    parseJsonObject(
      existing.requester_family_id === ownerFamilyId
        ? existing.requester_grants_json
        : existing.target_grants_json
    )
  );
  return Boolean(grants[permission]);
}

export function createFamilyRelationshipRequest(
  requesterFamilyId,
  targetFamilyId,
  relationType,
  requestedByMemberId
) {
  if (requesterFamilyId === targetFamilyId) {
    const error = new Error('Eine Familie kann sich nicht selbst verknüpfen.');
    error.statusCode = 400;
    throw error;
  }
  if (!getFamily(targetFamilyId)) {
    const error = new Error('Die ausgewählte Familie wurde nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }

  const existing = database
    .prepare(`
      SELECT * FROM family_relationships
      WHERE (
        requester_family_id = ? AND target_family_id = ?
      ) OR (
        requester_family_id = ? AND target_family_id = ?
      )
    `)
    .get(
      requesterFamilyId,
      targetFamilyId,
      targetFamilyId,
      requesterFamilyId
    );

  if (existing && existing.status !== 'declined') {
    const error = new Error(
      existing.status === 'accepted'
        ? 'Diese Familien sind bereits verknüpft.'
        : 'Zwischen diesen Familien wartet bereits eine Anfrage.'
    );
    error.statusCode = 409;
    throw error;
  }

  const now = Date.now();
  const id = existing?.id || `relationship-${randomUUID()}`;
  return withTransaction(() => {
    if (existing) {
      database
        .prepare(`
          UPDATE family_relationships SET
            requester_family_id = ?,
            target_family_id = ?,
            relation_type = ?,
            status = 'pending',
            requested_by_member_id = ?,
            responded_by_member_id = NULL,
            created_at = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .run(
          requesterFamilyId,
          targetFamilyId,
          relationType,
          requestedByMemberId,
          now,
          now,
          id
        );
    } else {
      database
        .prepare(`
          INSERT INTO family_relationships(
            id,
            requester_family_id,
            target_family_id,
            relation_type,
            status,
            requested_by_member_id,
            created_at,
            updated_at
          )
          VALUES(?, ?, ?, ?, 'pending', ?, ?, ?)
        `)
        .run(
          id,
          requesterFamilyId,
          targetFamilyId,
          relationType,
          requestedByMemberId,
          now,
          now
        );
    }
    bumpFamilyVersion(requesterFamilyId);
    bumpFamilyVersion(targetFamilyId);
    return listFamilyRelationships(requesterFamilyId).find(
      relationship => relationship.id === id
    );
  });
}

export function respondFamilyRelationship(
  targetFamilyId,
  relationshipId,
  accepted,
  respondedByMemberId
) {
  const existing = database
    .prepare(`
      SELECT * FROM family_relationships
      WHERE id = ? AND target_family_id = ? AND status = 'pending'
    `)
    .get(relationshipId, targetFamilyId);
  if (!existing) return null;

  return withTransaction(() => {
    database
      .prepare(`
        UPDATE family_relationships SET
          status = ?,
          responded_by_member_id = ?,
          updated_at = ?
        WHERE id = ?
      `)
      .run(
        accepted ? 'accepted' : 'declined',
        respondedByMemberId,
        Date.now(),
        relationshipId
      );
    bumpFamilyVersion(existing.requester_family_id);
    bumpFamilyVersion(existing.target_family_id);
    return listFamilyRelationships(targetFamilyId).find(
      relationship => relationship.id === relationshipId
    ) || {
      id: relationshipId,
      status: 'declined'
    };
  });
}

export function deleteFamilyRelationship(familyId, relationshipId) {
  const existing = database
    .prepare(`
      SELECT * FROM family_relationships
      WHERE id = ? AND (
        requester_family_id = ? OR target_family_id = ?
      )
    `)
    .get(relationshipId, familyId, familyId);
  if (!existing) return false;

  return withTransaction(() => {
    database
      .prepare('DELETE FROM family_relationships WHERE id = ?')
      .run(relationshipId);
    bumpFamilyVersion(existing.requester_family_id);
    bumpFamilyVersion(existing.target_family_id);
    return true;
  });
}

function mapFamilyLetterRow(row, familyId) {
  if (!row) return null;
  const sent = row.sender_family_id === familyId;
  return {
    id: row.id,
    threadId: row.thread_id,
    replyToId: row.reply_to_id || '',
    direction: sent ? 'sent' : 'received',
    subject: row.subject,
    body: row.body,
    createdAt: Number(row.created_at || 0),
    readAt: row.read_at ? Number(row.read_at) : null,
    archivedAt: row.archived_at ? Number(row.archived_at) : null,
    sender: {
      familyId: row.sender_family_id,
      familyName: row.sender_family_name,
      familyAvatar: row.sender_family_avatar,
      memberId: row.sender_member_id || '',
      memberName: row.sender_member_name || 'Familie'
    },
    recipient: {
      familyId: row.recipient_family_id,
      familyName: row.recipient_family_name,
      familyAvatar: row.recipient_family_avatar
    },
    otherFamily: sent
      ? {
          id: row.recipient_family_id,
          familyName: row.recipient_family_name,
          familyAvatar: row.recipient_family_avatar
        }
      : {
          id: row.sender_family_id,
          familyName: row.sender_family_name,
          familyAvatar: row.sender_family_avatar
        }
  };
}

const FAMILY_LETTER_SELECT = `
  SELECT
    letter.*,
    sender_family.name AS sender_family_name,
    sender_family.avatar AS sender_family_avatar,
    sender_member.name AS sender_member_name,
    recipient_family.name AS recipient_family_name,
    recipient_family.avatar AS recipient_family_avatar,
    letter_read.read_at,
    letter_read.archived_at
  FROM family_letters letter
  JOIN families sender_family ON sender_family.id = letter.sender_family_id
  JOIN families recipient_family
    ON recipient_family.id = letter.recipient_family_id
  LEFT JOIN members sender_member ON sender_member.id = letter.sender_member_id
  LEFT JOIN family_letter_reads letter_read
    ON letter_read.letter_id = letter.id
    AND letter_read.member_id = ?
`;

export function listFamilyLetters(
  familyId,
  memberId,
  { includeArchived = false, limit = 200 } = {}
) {
  const rows = database
    .prepare(`
      ${FAMILY_LETTER_SELECT}
      WHERE (
        letter.sender_family_id = ?
        OR letter.recipient_family_id = ?
      )
      ${includeArchived ? '' : 'AND letter_read.archived_at IS NULL'}
      ORDER BY letter.created_at DESC
      LIMIT ?
    `)
    .all(memberId, familyId, familyId, Math.max(1, Math.min(500, limit)));
  return rows.map(row => mapFamilyLetterRow(row, familyId));
}

export function createFamilyLetter(
  senderFamilyId,
  senderMemberId,
  recipientFamilyId,
  { subject, body, replyToId = '' }
) {
  const reply = replyToId
    ? database
        .prepare(`
          SELECT *
          FROM family_letters
          WHERE id = ?
            AND (
              sender_family_id = ?
              OR recipient_family_id = ?
            )
        `)
        .get(replyToId, senderFamilyId, senderFamilyId)
    : null;
  if (replyToId && !reply) {
    const error = new Error('Der beantwortete Brief wurde nicht gefunden.');
    error.statusCode = 404;
    throw error;
  }
  const id = `family-letter-${randomUUID()}`;
  const threadId = reply?.thread_id || id;
  const now = Date.now();
  return withTransaction(() => {
    database
      .prepare(`
        INSERT INTO family_letters(
          id, thread_id, sender_family_id, sender_member_id,
          recipient_family_id, reply_to_id, subject, body, created_at
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        threadId,
        senderFamilyId,
        senderMemberId || null,
        recipientFamilyId,
        reply?.id || null,
        String(subject || ''),
        String(body || ''),
        now
      );
    bumpFamilyVersion(senderFamilyId);
    bumpFamilyVersion(recipientFamilyId);
    return listFamilyLetters(senderFamilyId, senderMemberId, {
      includeArchived: true
    }).find(letter => letter.id === id);
  });
}

export function updateFamilyLetterState(
  familyId,
  memberId,
  letterId,
  { read, archived }
) {
  const letter = database
    .prepare(`
      SELECT *
      FROM family_letters
      WHERE id = ?
        AND (
          sender_family_id = ?
          OR recipient_family_id = ?
        )
    `)
    .get(letterId, familyId, familyId);
  if (!letter) return null;
  const existing = database
    .prepare(`
      SELECT read_at, archived_at
      FROM family_letter_reads
      WHERE letter_id = ? AND member_id = ?
    `)
    .get(letterId, memberId);
  const now = Date.now();
  const readAt = read === undefined
    ? existing?.read_at || null
    : read
      ? existing?.read_at || now
      : null;
  const archivedAt = archived === undefined
    ? existing?.archived_at || null
    : archived
      ? existing?.archived_at || now
      : null;
  database
    .prepare(`
      INSERT INTO family_letter_reads(
        letter_id, member_id, read_at, archived_at
      )
      VALUES(?, ?, ?, ?)
      ON CONFLICT(letter_id, member_id) DO UPDATE SET
        read_at = excluded.read_at,
        archived_at = excluded.archived_at
    `)
    .run(letterId, memberId, readAt, archivedAt);
  bumpFamilyVersion(familyId);
  return listFamilyLetters(familyId, memberId, {
    includeArchived: true
  }).find(entry => entry.id === letterId);
}

function mapFamilyChatGuestRow(row, familyId) {
  if (!row) return null;
  return {
    id: row.id,
    relationshipId: row.relationship_id,
    status: row.status,
    direction: row.host_family_id === familyId ? 'host' : 'guest',
    hostFamily: {
      id: row.host_family_id,
      familyName: row.host_family_name,
      familyAvatar: row.host_family_avatar
    },
    guestFamily: {
      id: row.guest_family_id,
      familyName: row.guest_family_name,
      familyAvatar: row.guest_family_avatar
    },
    guestMember: {
      id: row.guest_member_id,
      name: row.guest_member_name,
      role: row.guest_member_role,
      position: row.guest_member_position,
      avatar: row.guest_member_avatar,
      color: row.guest_member_color
    },
    invitedByMemberId: row.invited_by_member_id || '',
    acceptedAt: row.accepted_at ? Number(row.accepted_at) : null,
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0)
  };
}

const FAMILY_CHAT_GUEST_SELECT = `
  SELECT
    invitation.*,
    host.name AS host_family_name,
    host.avatar AS host_family_avatar,
    guest.name AS guest_family_name,
    guest.avatar AS guest_family_avatar,
    guest_member.name AS guest_member_name,
    guest_member.role AS guest_member_role,
    guest_member.position AS guest_member_position,
    guest_member.avatar AS guest_member_avatar,
    guest_member.color AS guest_member_color
  FROM family_chat_guests invitation
  JOIN families host ON host.id = invitation.host_family_id
  JOIN families guest ON guest.id = invitation.guest_family_id
  JOIN members guest_member ON guest_member.id = invitation.guest_member_id
`;

export function listFamilyChatGuests(familyId) {
  return database
    .prepare(`
      ${FAMILY_CHAT_GUEST_SELECT}
      WHERE invitation.host_family_id = ?
        OR invitation.guest_family_id = ?
      ORDER BY invitation.updated_at DESC
    `)
    .all(familyId, familyId)
    .map(row => mapFamilyChatGuestRow(row, familyId));
}

export function getFamilyChatGuest(familyId, invitationId) {
  const row = database
    .prepare(`
      ${FAMILY_CHAT_GUEST_SELECT}
      WHERE invitation.id = ?
        AND (
          invitation.host_family_id = ?
          OR invitation.guest_family_id = ?
        )
    `)
    .get(invitationId, familyId, familyId);
  return mapFamilyChatGuestRow(row, familyId);
}

export function createFamilyChatGuestInvite(
  hostFamilyId,
  relationshipId,
  guestMemberId,
  invitedByMemberId
) {
  const relationship = database
    .prepare(`
      SELECT *
      FROM family_relationships
      WHERE id = ?
        AND status = 'accepted'
        AND (
          requester_family_id = ?
          OR target_family_id = ?
        )
    `)
    .get(relationshipId, hostFamilyId, hostFamilyId);
  if (!relationship) {
    const error = new Error('Diese Familienverbindung ist nicht aktiv.');
    error.statusCode = 404;
    throw error;
  }
  const guestFamilyId =
    relationship.requester_family_id === hostFamilyId
      ? relationship.target_family_id
      : relationship.requester_family_id;
  const guestMember = getMember(guestFamilyId, guestMemberId);
  if (
    !guestMember ||
    guestMember.isManaged ||
    !['adult', 'senior'].includes(guestMember.role)
  ) {
    const error = new Error(
      'Als Chatgast können nur erwachsene Kontoprofile eingeladen werden.'
    );
    error.statusCode = 400;
    throw error;
  }
  const existing = database
    .prepare(`
      SELECT *
      FROM family_chat_guests
      WHERE host_family_id = ?
        AND guest_family_id = ?
        AND guest_member_id = ?
    `)
    .get(hostFamilyId, guestFamilyId, guestMemberId);
  if (existing && ['pending', 'accepted'].includes(existing.status)) {
    const error = new Error(
      existing.status === 'accepted'
        ? 'Dieses Profil ist bereits im Familienchat.'
        : 'Für dieses Profil wartet bereits eine Einladung.'
    );
    error.statusCode = 409;
    throw error;
  }
  const id = existing?.id || `family-chat-guest-${randomUUID()}`;
  const now = Date.now();
  return withTransaction(() => {
    if (existing) {
      database
        .prepare(`
          UPDATE family_chat_guests SET
            relationship_id = ?,
            invited_by_member_id = ?,
            status = 'pending',
            accepted_at = NULL,
            created_at = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .run(relationshipId, invitedByMemberId || null, now, now, id);
    } else {
      database
        .prepare(`
          INSERT INTO family_chat_guests(
            id, relationship_id, host_family_id, guest_family_id,
            guest_member_id, invited_by_member_id, status,
            created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `)
        .run(
          id,
          relationshipId,
          hostFamilyId,
          guestFamilyId,
          guestMemberId,
          invitedByMemberId || null,
          now,
          now
        );
    }
    bumpFamilyVersion(hostFamilyId);
    bumpFamilyVersion(guestFamilyId);
    return getFamilyChatGuest(hostFamilyId, id);
  });
}

export function updateFamilyChatGuestStatus(
  familyId,
  invitationId,
  status
) {
  const existing = database
    .prepare(`
      SELECT *
      FROM family_chat_guests
      WHERE id = ?
        AND (
          host_family_id = ?
          OR guest_family_id = ?
        )
    `)
    .get(invitationId, familyId, familyId);
  if (!existing) return null;
  const now = Date.now();
  database
    .prepare(`
      UPDATE family_chat_guests
      SET status = ?,
          accepted_at = CASE
            WHEN ? = 'accepted' THEN COALESCE(accepted_at, ?)
            ELSE accepted_at
          END,
          updated_at = ?
      WHERE id = ?
    `)
    .run(status, status, now, now, invitationId);
  bumpFamilyVersion(existing.host_family_id);
  bumpFamilyVersion(existing.guest_family_id);
  return getFamilyChatGuest(familyId, invitationId);
}

export function listAcceptedChatGuestsForHost(hostFamilyId) {
  return database
    .prepare(`
      ${FAMILY_CHAT_GUEST_SELECT}
      WHERE invitation.host_family_id = ?
        AND invitation.status = 'accepted'
      ORDER BY invitation.updated_at DESC
    `)
    .all(hostFamilyId)
    .map(row => mapFamilyChatGuestRow(row, hostFamilyId));
}

function sharedEventRecipients(eventId) {
  return database
    .prepare(`
      SELECT family.id, family.name, family.avatar
      FROM shared_family_event_recipients recipient
      JOIN families family ON family.id = recipient.family_id
      WHERE recipient.event_id = ?
      ORDER BY family.name COLLATE NOCASE
    `)
    .all(eventId)
    .map(row => ({
      id: row.id,
      familyName: row.name,
      familyAvatar: row.avatar
    }));
}

function mapSharedFamilyEvent(row, familyId) {
  const data = parseJsonObject(row.data_json);
  const owner = row.owner_family_id === familyId;
  return {
    ...data,
    id: owner ? row.id : `shared-${row.id}`,
    memberId: owner ? (data.memberId || 'all') : 'all',
    memberIds: owner
      ? (Array.isArray(data.memberIds) ? data.memberIds : [])
      : [],
    household: owner ? (data.household || 'familie') : 'familie',
    readOnly: !owner,
    sharedEventId: row.id,
    sharedOwnerFamilyId: row.owner_family_id,
    sharedOwnerFamilyName: row.owner_family_name,
    sharedWithFamilies: sharedEventRecipients(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listSharedFamilyEvents(familyId) {
  return database
    .prepare(`
      SELECT event.*, owner.name AS owner_family_name
      FROM shared_family_events event
      JOIN families owner ON owner.id = event.owner_family_id
      WHERE event.owner_family_id = ?
        OR EXISTS (
          SELECT 1
          FROM shared_family_event_recipients recipient
          WHERE recipient.event_id = event.id
            AND recipient.family_id = ?
        )
      ORDER BY event.created_at DESC
    `)
    .all(familyId, familyId)
    .map(row => mapSharedFamilyEvent(row, familyId));
}

export function createSharedFamilyEvent(
  ownerFamilyId,
  createdByMemberId,
  event,
  recipientFamilyIds
) {
  const recipients = [
    ...new Set(
      (recipientFamilyIds || [])
        .map(value => String(value || '').trim())
        .filter(value => value && value !== ownerFamilyId)
    )
  ].slice(0, 12);
  if (!recipients.length) {
    const error = new Error('Wähle mindestens eine verbundene Familie aus.');
    error.statusCode = 400;
    throw error;
  }
  recipients.forEach(targetFamilyId => {
    if (
      !relationshipAllows(
        targetFamilyId,
        ownerFamilyId,
        'sharedCalendar'
      )
    ) {
      const error = new Error(
        'Eine ausgewählte Familie hat gemeinsame Termine nicht freigegeben.'
      );
      error.statusCode = 403;
      throw error;
    }
  });
  const now = Date.now();
  const id = String(event.id || `shared-event-${randomUUID()}`);
  return withTransaction(() => {
    database
      .prepare(`
        INSERT INTO shared_family_events(
          id, owner_family_id, created_by_member_id,
          data_json, created_at, updated_at
        )
        VALUES(?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        ownerFamilyId,
        createdByMemberId || null,
        JSON.stringify({ ...event, id }),
        now,
        now
      );
    const insertRecipient = database.prepare(`
      INSERT INTO shared_family_event_recipients(event_id, family_id)
      VALUES(?, ?)
    `);
    recipients.forEach(familyId => insertRecipient.run(id, familyId));
    bumpFamilyVersion(ownerFamilyId);
    recipients.forEach(familyId => bumpFamilyVersion(familyId));
    const row = database
      .prepare(`
        SELECT event.*, owner.name AS owner_family_name
        FROM shared_family_events event
        JOIN families owner ON owner.id = event.owner_family_id
        WHERE event.id = ?
      `)
      .get(id);
    return mapSharedFamilyEvent(row, ownerFamilyId);
  });
}

export function updateSharedFamilyEvent(
  ownerFamilyId,
  eventId,
  changes = {}
) {
  const existing = database
    .prepare(`
      SELECT event.*, owner.name AS owner_family_name
      FROM shared_family_events event
      JOIN families owner ON owner.id = event.owner_family_id
      WHERE event.id = ? AND event.owner_family_id = ?
    `)
    .get(eventId, ownerFamilyId);
  if (!existing) return null;
  const recipientFamilyIds = database
    .prepare(`
      SELECT family_id
      FROM shared_family_event_recipients
      WHERE event_id = ?
    `)
    .all(eventId)
    .map(row => row.family_id);
  const updatedAt = Date.now();
  const data = {
    ...parseJsonObject(existing.data_json),
    ...(changes || {}),
    id: eventId
  };
  return withTransaction(() => {
    database
      .prepare(`
        UPDATE shared_family_events
        SET data_json = ?, updated_at = ?
        WHERE id = ? AND owner_family_id = ?
      `)
      .run(JSON.stringify(data), updatedAt, eventId, ownerFamilyId);
    bumpFamilyVersion(ownerFamilyId);
    recipientFamilyIds.forEach(familyId => bumpFamilyVersion(familyId));
    const row = database
      .prepare(`
        SELECT event.*, owner.name AS owner_family_name
        FROM shared_family_events event
        JOIN families owner ON owner.id = event.owner_family_id
        WHERE event.id = ?
      `)
      .get(eventId);
    return {
      event: mapSharedFamilyEvent(row, ownerFamilyId),
      recipientFamilyIds
    };
  });
}

export function deleteSharedFamilyEvent(ownerFamilyId, eventId) {
  const existing = database
    .prepare(`
      SELECT * FROM shared_family_events
      WHERE id = ? AND owner_family_id = ?
    `)
    .get(eventId, ownerFamilyId);
  if (!existing) return false;
  const event = parseJsonObject(existing.data_json);
  const recipients = database
    .prepare(`
      SELECT family_id
      FROM shared_family_event_recipients
      WHERE event_id = ?
    `)
    .all(eventId)
    .map(row => row.family_id);
  return withTransaction(() => {
    database
      .prepare('DELETE FROM shared_family_events WHERE id = ?')
      .run(eventId);
    bumpFamilyVersion(ownerFamilyId);
    recipients.forEach(familyId => bumpFamilyVersion(familyId));
    return {
      recipientFamilyIds: recipients,
      event: {
        ...event,
        id: existing.id,
        sharedEventId: existing.id
      }
    };
  });
}

export function replaceRecordsBySource(familyId, type, source, records) {
  assertRecordType(type);
  return withTransaction(() => {
    const existing = listRecords(familyId, type);
    const removeIds = existing
      .filter(record => record.source === source)
      .map(record => record.id);
    const remove = database.prepare(`
      DELETE FROM family_records
      WHERE family_id = ? AND type = ? AND id = ?
    `);
    removeIds.forEach(id => remove.run(familyId, type, id));
    const inserted = records.map(record =>
      upsertRecord(
        familyId,
        type,
        { ...record, source },
        { bump: false }
      )
    );
    bumpFamilyVersion(familyId);
    return inserted;
  });
}

export function getBootstrap(familyId) {
  const resources = {};
  for (const type of RECORD_TYPES) {
    resources[type] = listRecords(familyId, type);
  }
  resources.events = [
    ...resources.events,
    ...listSharedFamilyEvents(familyId)
  ];
  return {
    family: getFamily(familyId),
    members: getMembers(familyId),
    resources,
    version: getFamilyVersion(familyId)
  };
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(familyId, { memberId = null, maxAgeMs = 1000 * 60 * 60 * 24 * 30 } = {}) {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO sessions(token_hash, family_id, member_id, created_at, expires_at)
      VALUES(?, ?, ?, ?, ?)
    `)
    .run(hashToken(token), familyId, memberId, now, now + maxAgeMs);
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const now = Date.now();
  database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  const row = database
    .prepare(`
      SELECT s.*, f.name AS family_name
      FROM sessions s
      JOIN families f ON f.id = s.family_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `)
    .get(hashToken(token), now);
  if (!row) return null;
  return {
    tokenHash: row.token_hash,
    familyId: row.family_id,
    memberId: row.member_id,
    expiresAt: row.expires_at
  };
}

export function setSessionMember(token, familyId, memberId) {
  return database
    .prepare(`
      UPDATE sessions SET member_id = ?
      WHERE token_hash = ? AND family_id = ?
    `)
    .run(memberId, hashToken(token), familyId).changes > 0;
}

export function deleteSession(token) {
  if (!token) return false;
  return database
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .run(hashToken(token)).changes > 0;
}

function mapPushSubscriptionRow(row) {
  if (!row) return null;
  let preferences = {};
  try {
    preferences = JSON.parse(row.preferences_json || '{}');
  } catch {
    preferences = {};
  }
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth
    },
    deviceName: row.device_name,
    preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listPushSubscriptions(familyId, { memberId } = {}) {
  const rows = memberId
    ? database
        .prepare(`
          SELECT * FROM push_subscriptions
          WHERE family_id = ? AND member_id = ?
          ORDER BY updated_at DESC
        `)
        .all(familyId, memberId)
    : database
        .prepare(`
          SELECT * FROM push_subscriptions
          WHERE family_id = ?
          ORDER BY updated_at DESC
        `)
        .all(familyId);
  return rows.map(mapPushSubscriptionRow);
}

export function savePushSubscription({
  familyId,
  memberId,
  endpoint,
  keys,
  deviceName = 'Dieses Gerät',
  preferences = {}
}) {
  const now = Date.now();
  const id = `push-${randomUUID()}`;
  database
    .prepare(`
      INSERT INTO push_subscriptions(
        id, family_id, member_id, endpoint, p256dh, auth,
        device_name, preferences_json, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(family_id, member_id, endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        device_name = excluded.device_name,
        preferences_json = excluded.preferences_json,
        updated_at = excluded.updated_at
    `)
    .run(
      id,
      familyId,
      memberId,
      endpoint,
      keys.p256dh,
      keys.auth,
      deviceName,
      JSON.stringify(preferences || {}),
      now,
      now
    );
  return mapPushSubscriptionRow(
    database
      .prepare(`
        SELECT * FROM push_subscriptions
        WHERE family_id = ? AND member_id = ? AND endpoint = ?
      `)
      .get(familyId, memberId, endpoint)
  );
}

export function deletePushSubscription(familyId, memberId, endpoint) {
  return database
    .prepare(`
      DELETE FROM push_subscriptions
      WHERE family_id = ? AND member_id = ? AND endpoint = ?
    `)
    .run(familyId, memberId, endpoint).changes > 0;
}

export function deletePushSubscriptionById(familyId, subscriptionId) {
  return database
    .prepare(`
      DELETE FROM push_subscriptions
      WHERE family_id = ? AND id = ?
    `)
    .run(familyId, subscriptionId).changes > 0;
}

export function countPushSubscriptionsByEndpoint(endpoint) {
  return Number(
    database
      .prepare(`
        SELECT COUNT(*) AS count FROM push_subscriptions
        WHERE endpoint = ?
      `)
      .get(endpoint)?.count || 0
  );
}

function mapNativePushDeviceRow(row) {
  if (!row) return null;
  let preferences = {};
  try {
    preferences = JSON.parse(row.preferences_json || '{}');
  } catch {
    preferences = {};
  }
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    installationId: row.installation_id,
    token: row.token,
    platform: row.platform,
    deviceName: row.device_name,
    appVersion: row.app_version,
    preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listNativePushDevices(
  familyId,
  { memberId, installationId } = {}
) {
  const clauses = ['family_id = ?'];
  const values = [familyId];
  if (memberId) {
    clauses.push('member_id = ?');
    values.push(memberId);
  }
  if (installationId) {
    clauses.push('installation_id = ?');
    values.push(installationId);
  }
  return database
    .prepare(`
      SELECT * FROM native_push_devices
      WHERE ${clauses.join(' AND ')}
      ORDER BY updated_at DESC
    `)
    .all(...values)
    .map(mapNativePushDeviceRow);
}

export function saveNativePushDevice({
  familyId,
  memberId,
  installationId,
  token,
  platform = 'android',
  deviceName = 'Android-Gerät',
  appVersion = '',
  preferences = {}
}) {
  const now = Date.now();
  const id = `native-push-${randomUUID()}`;
  return withTransaction(() => {
    database
      .prepare(`
        UPDATE native_push_devices
        SET token = ?, platform = ?, device_name = ?,
            app_version = ?, updated_at = ?
        WHERE family_id = ? AND installation_id = ?
      `)
      .run(
        token,
        platform,
        deviceName,
        appVersion,
        now,
        familyId,
        installationId
      );
    database
      .prepare(`
        INSERT INTO native_push_devices(
          id, family_id, member_id, installation_id, token, platform,
          device_name, app_version, preferences_json, created_at, updated_at
        )
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(family_id, member_id, installation_id) DO UPDATE SET
          token = excluded.token,
          platform = excluded.platform,
          device_name = excluded.device_name,
          app_version = excluded.app_version,
          preferences_json = excluded.preferences_json,
          updated_at = excluded.updated_at
      `)
      .run(
        id,
        familyId,
        memberId,
        installationId,
        token,
        platform,
        deviceName,
        appVersion,
        JSON.stringify(preferences || {}),
        now,
        now
      );
    return mapNativePushDeviceRow(
      database
        .prepare(`
          SELECT * FROM native_push_devices
          WHERE family_id = ? AND member_id = ? AND installation_id = ?
        `)
        .get(familyId, memberId, installationId)
    );
  });
}

export function deleteNativePushDevice(
  familyId,
  memberId,
  installationId
) {
  return database
    .prepare(`
      DELETE FROM native_push_devices
      WHERE family_id = ? AND member_id = ? AND installation_id = ?
    `)
    .run(familyId, memberId, installationId).changes > 0;
}

export function deleteNativePushDeviceById(familyId, deviceId) {
  return database
    .prepare(`
      DELETE FROM native_push_devices
      WHERE family_id = ? AND id = ?
    `)
    .run(familyId, deviceId).changes > 0;
}

export function deleteNativePushDevicesByToken(token) {
  return database
    .prepare('DELETE FROM native_push_devices WHERE token = ?')
    .run(token).changes;
}

export function countNativePushProfilesForInstallation(
  familyId,
  installationId
) {
  return Number(
    database
      .prepare(`
        SELECT COUNT(*) AS count FROM native_push_devices
        WHERE family_id = ? AND installation_id = ?
      `)
      .get(familyId, installationId)?.count || 0
  );
}

function mapInboxNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    familyId: row.family_id,
    memberId: row.member_id,
    eventKey: row.event_key,
    title: row.title,
    body: row.body,
    url: row.url,
    priority: row.priority,
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
    readAt: row.read_at || null,
    read: Boolean(row.read_at)
  };
}

export function createInboxNotifications(
  familyId,
  memberIds,
  {
    eventKey = 'update',
    title = 'Neu in LX Family',
    body = '',
    url = '/',
    priority = 'normal',
    dedupeKey = ''
  } = {}
) {
  const recipients = [...new Set((memberIds || []).filter(Boolean))];
  if (!recipients.length) return [];
  const now = Date.now();
  const stableKey = String(dedupeKey || `${eventKey}-${now}`);
  const insert = database.prepare(`
    INSERT INTO inbox_notifications(
      id, family_id, member_id, event_key, title, body, url,
      priority, dedupe_key, created_at, read_at
    )
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(family_id, member_id, dedupe_key) DO NOTHING
  `);

  return withTransaction(() => {
    const created = [];
    for (const memberId of recipients) {
      const id = `notification-${randomUUID()}`;
      const result = insert.run(
        id,
        familyId,
        memberId,
        String(eventKey || 'update'),
        String(title || 'Neu in LX Family'),
        String(body || ''),
        String(url || '/'),
        String(priority || 'normal'),
        stableKey,
        now
      );
      if (result.changes > 0) {
        created.push(
          mapInboxNotificationRow(
            database
              .prepare('SELECT * FROM inbox_notifications WHERE id = ?')
              .get(id)
          )
        );
      }
    }

    database
      .prepare(`
        DELETE FROM inbox_notifications
        WHERE family_id = ?
          AND (
            created_at < ?
            OR id NOT IN (
              SELECT id FROM inbox_notifications recent
              WHERE recent.family_id = inbox_notifications.family_id
                AND recent.member_id = inbox_notifications.member_id
              ORDER BY recent.created_at DESC
              LIMIT 200
            )
          )
      `)
      .run(familyId, now - 1000 * 60 * 60 * 24 * 90);

    if (created.length) bumpFamilyVersion(familyId);
    return created;
  });
}

export function listInboxNotifications(
  familyId,
  memberId,
  { limit = 80 } = {}
) {
  if (!memberId) return [];
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 80));
  return database
    .prepare(`
      SELECT * FROM inbox_notifications
      WHERE family_id = ? AND member_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .all(familyId, memberId, safeLimit)
    .map(mapInboxNotificationRow);
}

export function countUnreadInboxNotifications(familyId, memberId) {
  if (!memberId) return 0;
  return Number(
    database
      .prepare(`
        SELECT COUNT(*) AS count
        FROM inbox_notifications
        WHERE family_id = ? AND member_id = ? AND read_at IS NULL
      `)
      .get(familyId, memberId)?.count || 0
  );
}

export function markInboxNotificationRead(
  familyId,
  memberId,
  notificationId,
  read = true
) {
  const readAt = read ? Date.now() : null;
  const result = database
    .prepare(`
      UPDATE inbox_notifications
      SET read_at = ?
      WHERE id = ? AND family_id = ? AND member_id = ?
    `)
    .run(readAt, notificationId, familyId, memberId);
  if (result.changes > 0) bumpFamilyVersion(familyId);
  return mapInboxNotificationRow(
    database
      .prepare(`
        SELECT * FROM inbox_notifications
        WHERE id = ? AND family_id = ? AND member_id = ?
      `)
      .get(notificationId, familyId, memberId)
  );
}

export function markAllInboxNotificationsRead(familyId, memberId) {
  if (!memberId) return 0;
  const result = database
    .prepare(`
      UPDATE inbox_notifications
      SET read_at = ?
      WHERE family_id = ? AND member_id = ? AND read_at IS NULL
    `)
    .run(Date.now(), familyId, memberId);
  if (result.changes > 0) bumpFamilyVersion(familyId);
  return result.changes;
}

export function listEventReminderDeliveries(
  familyId,
  eventId,
  eventStartKey
) {
  return database
    .prepare(`
      SELECT reminder_minutes
      FROM event_reminder_deliveries
      WHERE family_id = ?
        AND event_id = ?
        AND event_start_key = ?
    `)
    .all(familyId, eventId, eventStartKey)
    .map(row => Number(row.reminder_minutes));
}

export function markEventReminderDeliveries(
  familyId,
  eventId,
  eventStartKey,
  reminderMinutes,
  deliveredAt = Date.now()
) {
  const insert = database.prepare(`
    INSERT INTO event_reminder_deliveries(
      family_id,
      event_id,
      event_start_key,
      reminder_minutes,
      delivered_at
    )
    VALUES(?, ?, ?, ?, ?)
    ON CONFLICT(
      family_id,
      event_id,
      event_start_key,
      reminder_minutes
    ) DO NOTHING
  `);
  return withTransaction(() =>
    [...new Set((reminderMinutes || []).map(Number))]
      .filter(Number.isInteger)
      .reduce(
        (created, minutes) =>
          created + Number(
            insert.run(
              familyId,
              eventId,
              eventStartKey,
              minutes,
              deliveredAt
            ).changes || 0
          ),
        0
      )
  );
}

export function pruneEventReminderDeliveries(
  before = Date.now() - 1000 * 60 * 60 * 24 * 90
) {
  return Number(
    database
      .prepare(`
        DELETE FROM event_reminder_deliveries
        WHERE delivered_at < ?
      `)
      .run(Number(before)).changes || 0
  );
}

function calendarSubscriptionMemberIds(row) {
  try {
    const value = JSON.parse(row?.member_ids_json || '[]');
    if (Array.isArray(value)) {
      return [...new Set(value
        .map(memberId => String(memberId || '').trim())
        .filter(memberId => memberId && memberId !== 'all'))];
    }
  } catch {
    // Legacy rows fall back to their former single profile assignment.
  }
  return row?.member_id && row.member_id !== 'all' ? [row.member_id] : [];
}

function mapCalendarSubscriptionRow(row, { includeSecret = false } = {}) {
  if (!row) return null;
  const memberIds = calendarSubscriptionMemberIds(row);
  const subscription = {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    host: row.feed_host,
    color: row.color,
    memberId: memberIds[0] || 'all',
    memberIds,
    household: row.household,
    kind: row.kind || 'calendar',
    provider: row.provider === 'caldav' ? 'caldav' : 'ics',
    syncMode: row.provider === 'caldav' && row.sync_mode === 'two-way'
      ? 'two-way'
      : 'read',
    enabled: Boolean(row.enabled),
    lastSyncedAt: row.last_synced_at || null,
    lastSuccessAt: row.last_success_at || null,
    lastError: row.last_error || '',
    eventCount: Number(row.event_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includeSecret) {
    subscription.secretEncrypted = row.secret_encrypted;
  }
  return subscription;
}

export function listCalendarSubscriptions(
  familyId,
  { includeSecret = false } = {}
) {
  return database
    .prepare(`
      SELECT * FROM calendar_subscriptions
      WHERE family_id = ?
      ORDER BY name COLLATE NOCASE ASC, created_at ASC
    `)
    .all(familyId)
    .map(row => mapCalendarSubscriptionRow(row, { includeSecret }));
}

export function listEnabledCalendarSubscriptions({
  includeSecret = true
} = {}) {
  return database
    .prepare(`
      SELECT * FROM calendar_subscriptions
      WHERE enabled = 1
      ORDER BY COALESCE(last_synced_at, 0) ASC
    `)
    .all()
    .map(row => mapCalendarSubscriptionRow(row, { includeSecret }));
}

export function getCalendarSubscription(
  familyId,
  subscriptionId,
  { includeSecret = false } = {}
) {
  return mapCalendarSubscriptionRow(
    database
      .prepare(`
        SELECT * FROM calendar_subscriptions
        WHERE family_id = ? AND id = ?
      `)
      .get(familyId, subscriptionId),
    { includeSecret }
  );
}

export function createCalendarSubscription(
  familyId,
  {
    name,
    host = '',
    secretEncrypted,
    color = '#2563eb',
    memberId = 'all',
    memberIds = [],
    household = 'familie',
    kind = 'calendar',
    provider = 'ics',
    syncMode = 'read',
    enabled = true
  }
) {
  const id = `calendar-${randomUUID()}`;
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO calendar_subscriptions(
        id, family_id, name, feed_host, secret_encrypted, color,
        member_id, member_ids_json, household, kind, provider, sync_mode, enabled, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      id,
      familyId,
      name,
      host,
      secretEncrypted,
      color,
      memberId,
      JSON.stringify(memberIds),
      household,
      kind === 'trash' ? 'trash' : 'calendar',
      provider === 'caldav' ? 'caldav' : 'ics',
      provider === 'caldav' && syncMode === 'two-way' ? 'two-way' : 'read',
      enabled ? 1 : 0,
      now,
      now
    );
  bumpFamilyVersion(familyId);
  return getCalendarSubscription(familyId, id);
}

export function updateCalendarSubscription(
  familyId,
  subscriptionId,
  changes = {}
) {
  const existing = getCalendarSubscription(
    familyId,
    subscriptionId,
    { includeSecret: true }
  );
  if (!existing) return null;
  const updated = {
    ...existing,
    ...changes,
    updatedAt: Date.now()
  };
  database
    .prepare(`
      UPDATE calendar_subscriptions SET
        name = ?,
        feed_host = ?,
        secret_encrypted = ?,
        color = ?,
        member_id = ?,
        member_ids_json = ?,
        household = ?,
        kind = ?,
        provider = ?,
        sync_mode = ?,
        enabled = ?,
        updated_at = ?
      WHERE family_id = ? AND id = ?
    `)
    .run(
      updated.name,
      updated.host,
      updated.secretEncrypted,
      updated.color,
      updated.memberId,
      JSON.stringify(Array.isArray(updated.memberIds) ? updated.memberIds : []),
      updated.household,
      updated.kind === 'trash' ? 'trash' : 'calendar',
      updated.provider === 'caldav' ? 'caldav' : 'ics',
      updated.provider === 'caldav' && updated.syncMode === 'two-way'
        ? 'two-way'
        : 'read',
      updated.enabled ? 1 : 0,
      updated.updatedAt,
      familyId,
      subscriptionId
    );
  bumpFamilyVersion(familyId);
  return getCalendarSubscription(familyId, subscriptionId);
}

export function updateCalendarSubscriptionSync(
  familyId,
  subscriptionId,
  {
    success,
    eventCount = 0,
    error = ''
  }
) {
  const now = Date.now();
  const result = database
    .prepare(`
      UPDATE calendar_subscriptions SET
        last_synced_at = ?,
        last_success_at = CASE WHEN ? THEN ? ELSE last_success_at END,
        last_error = ?,
        event_count = CASE WHEN ? THEN ? ELSE event_count END,
        updated_at = ?
      WHERE family_id = ? AND id = ?
    `)
    .run(
      now,
      success ? 1 : 0,
      now,
      String(error || ''),
      success ? 1 : 0,
      Math.max(0, Number(eventCount || 0)),
      now,
      familyId,
      subscriptionId
    );
  if (!result.changes) return null;
  bumpFamilyVersion(familyId);
  return getCalendarSubscription(familyId, subscriptionId);
}

export function deleteCalendarSubscription(familyId, subscriptionId) {
  const result = database
    .prepare(`
      DELETE FROM calendar_subscriptions
      WHERE family_id = ? AND id = ?
    `)
    .run(familyId, subscriptionId);
  if (result.changes) bumpFamilyVersion(familyId);
  return result.changes > 0;
}

export function deletePushSubscriptionsByEndpoint(endpoint) {
  return database
    .prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
    .run(endpoint).changes;
}

export function getIntegration(familyId, provider) {
  const row = database
    .prepare(`
      SELECT * FROM integrations
      WHERE family_id = ? AND provider = ?
    `)
    .get(familyId, provider);
  if (!row) return null;
  return {
    familyId: row.family_id,
    provider: row.provider,
    config: JSON.parse(row.config_json || '{}'),
    secretEncrypted: row.secret_encrypted,
    updatedAt: row.updated_at
  };
}

export function listIntegrationsByProvider(provider) {
  return database
    .prepare(`
      SELECT * FROM integrations
      WHERE provider = ?
      ORDER BY updated_at ASC
    `)
    .all(provider)
    .map(row => ({
      familyId: row.family_id,
      provider: row.provider,
      config: JSON.parse(row.config_json || '{}'),
      secretEncrypted: row.secret_encrypted,
      updatedAt: row.updated_at
    }));
}

export function saveIntegration(familyId, provider, config, secretEncrypted) {
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO integrations(
        family_id, provider, config_json, secret_encrypted, updated_at
      )
      VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(family_id, provider) DO UPDATE SET
        config_json = excluded.config_json,
        secret_encrypted = excluded.secret_encrypted,
        updated_at = excluded.updated_at
    `)
    .run(familyId, provider, JSON.stringify(config || {}), secretEncrypted, now);
  bumpFamilyVersion(familyId);
}

export function deleteIntegration(familyId, provider) {
  database
    .prepare(`
      DELETE FROM integration_sync_items
      WHERE family_id = ? AND provider = ?
    `)
    .run(familyId, provider);
  const changes = database
    .prepare(`
      DELETE FROM integrations
      WHERE family_id = ? AND provider = ?
    `)
    .run(familyId, provider).changes;
  if (changes > 0) bumpFamilyVersion(familyId);
  return changes > 0;
}

function mapIntegrationSyncItem(row) {
  if (!row) return null;
  return {
    familyId: row.family_id,
    provider: row.provider,
    itemType: row.item_type,
    localId: row.local_id,
    remoteHref: row.remote_href,
    remoteEtag: row.remote_etag,
    localHash: row.local_hash,
    remoteHash: row.remote_hash,
    lastSyncedAt: row.last_synced_at
  };
}

export function listIntegrationSyncItems(familyId, provider, itemType) {
  return database
    .prepare(`
      SELECT * FROM integration_sync_items
      WHERE family_id = ? AND provider = ? AND item_type = ?
      ORDER BY last_synced_at ASC
    `)
    .all(familyId, provider, itemType)
    .map(mapIntegrationSyncItem);
}

export function saveIntegrationSyncItem(
  familyId,
  provider,
  itemType,
  {
    localId,
    remoteHref,
    remoteEtag = '',
    localHash = '',
    remoteHash = ''
  }
) {
  const now = Date.now();
  database
    .prepare(`
      INSERT INTO integration_sync_items(
        family_id, provider, item_type, local_id, remote_href,
        remote_etag, local_hash, remote_hash, last_synced_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(family_id, provider, item_type, local_id) DO UPDATE SET
        remote_href = excluded.remote_href,
        remote_etag = excluded.remote_etag,
        local_hash = excluded.local_hash,
        remote_hash = excluded.remote_hash,
        last_synced_at = excluded.last_synced_at
    `)
    .run(
      familyId,
      provider,
      itemType,
      localId,
      remoteHref,
      remoteEtag,
      localHash,
      remoteHash,
      now
    );
  return mapIntegrationSyncItem(
    database
      .prepare(`
        SELECT * FROM integration_sync_items
        WHERE family_id = ? AND provider = ?
          AND item_type = ? AND local_id = ?
      `)
      .get(familyId, provider, itemType, localId)
  );
}

export function deleteIntegrationSyncItem(
  familyId,
  provider,
  itemType,
  localId
) {
  return database
    .prepare(`
      DELETE FROM integration_sync_items
      WHERE family_id = ? AND provider = ?
        AND item_type = ? AND local_id = ?
    `)
    .run(familyId, provider, itemType, localId).changes > 0;
}

export function deleteIntegrationSyncItems(familyId, provider) {
  return database
    .prepare(`
      DELETE FROM integration_sync_items
      WHERE family_id = ? AND provider = ?
    `)
    .run(familyId, provider).changes;
}

function mapProblemReport(row) {
  return row
    ? {
        id: row.id,
        familyId: row.family_id,
        memberId: row.member_id,
        category: row.category,
        title: row.title,
        description: row.description,
        page: row.page,
        appVersion: row.app_version,
        clientInfo: row.client_info,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    : null;
}

export function createProblemReport(familyId, memberId, report) {
  const now = Date.now();
  const id = String(report.id || `problem-${randomUUID()}`);
  database
    .prepare(`
      INSERT INTO problem_reports(
        id, family_id, member_id, category, title, description,
        page, app_version, client_info, status, created_at, updated_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
    `)
    .run(
      id,
      familyId,
      memberId || null,
      String(report.category || 'problem'),
      String(report.title || ''),
      String(report.description || ''),
      String(report.page || ''),
      String(report.appVersion || ''),
      String(report.clientInfo || ''),
      now,
      now
    );
  return mapProblemReport(
    database.prepare('SELECT * FROM problem_reports WHERE id = ?').get(id)
  );
}

export function listProblemReports(familyId, { limit = 50 } = {}) {
  return database
    .prepare(`
      SELECT *
      FROM problem_reports
      WHERE family_id = ?
      ORDER BY
        CASE status WHEN 'open' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT ?
    `)
    .all(familyId, Math.max(1, Math.min(200, Number(limit) || 50)))
    .map(mapProblemReport);
}

export function updateProblemReportStatus(familyId, reportId, status) {
  const result = database
    .prepare(`
      UPDATE problem_reports
      SET status = ?, updated_at = ?
      WHERE family_id = ? AND id = ?
    `)
    .run(status, Date.now(), familyId, reportId);
  if (!result.changes) return null;
  return mapProblemReport(
    database
      .prepare(`
        SELECT * FROM problem_reports
        WHERE family_id = ? AND id = ?
      `)
      .get(familyId, reportId)
  );
}

function updateTaskMemberStars(
  familyId,
  task,
  direction,
  memberId = task.memberId
) {
  if (!memberId || !direction) return null;
  const existingMember = getMemberAuthRow(familyId, memberId);
  if (!existingMember) return null;
  const points = Math.max(0, Number(task.stars ?? 10));
  const nextStars = Math.max(
    0,
    Number(existingMember.stars || 0) + direction * points
  );
  database
    .prepare(`
      UPDATE members SET stars = ?, updated_at = ?
      WHERE family_id = ? AND id = ?
    `)
    .run(nextStars, Date.now(), familyId, memberId);
  return getMember(familyId, memberId);
}

function createNextRecurringTask(familyId, task) {
  if (!task || task.repeatRule === 'none' || !task.repeatRule) return null;
  const nextDueDate = nextTaskDueDate(
    task.dueDate || task.occurrenceDate,
    task.repeatRule,
    task.repeatAnchorDay,
    task.repeatInterval,
    task.repeatUnit
  );
  if (!nextDueDate) return null;
  const seriesId = task.seriesId || task.id;
  const duplicate = listRecords(familyId, 'tasks').find(
    record =>
      record.seriesId === seriesId &&
      (record.occurrenceDate || record.dueDate) === nextDueDate
  );
  if (duplicate) return duplicate;

  const rotationMemberIds = Array.isArray(task.rotationMemberIds)
    ? task.rotationMemberIds.filter(memberId =>
        Boolean(getMember(familyId, memberId))
      )
    : [];
  const currentRotationIndex = Math.max(
    0,
    rotationMemberIds.indexOf(task.memberId)
  );
  const nextRotationIndex = rotationMemberIds.length > 1
    ? (currentRotationIndex + 1) % rotationMemberIds.length
    : currentRotationIndex;
  const nextMemberId =
    rotationMemberIds[nextRotationIndex] || task.memberId;

  const nextTask = {
    ...task,
    id: `task-${randomUUID()}`,
    seriesId,
    occurrenceDate: nextDueDate,
    dueDate: nextDueDate,
    memberId: nextMemberId,
    rotationMemberIds,
    rotationIndex: nextRotationIndex,
    previousOccurrenceId: task.id,
    completed: false,
    completionStatus: 'open',
    completedByMemberId: null,
    completedByName: '',
    completionRequestedByMemberId: null,
    completionRequestedAt: null,
    completionApprovedByMemberId: null,
    completionApprovedAt: null,
    completionRejectedByMemberId: null,
    completionRejectedAt: null,
    createdAt: Date.now()
  };
  delete nextTask.nextOccurrenceId;
  return upsertRecord(
    familyId,
    'tasks',
    nextTask,
    { bump: false }
  );
}

export function toggleTaskRecord(
  familyId,
  taskId,
  actorMemberId = '',
  completedByMemberId = actorMemberId
) {
  return withTransaction(() => {
    const task = getRecord(familyId, 'tasks', taskId);
    if (!task) return null;
    const completed = !task.completed;
    const now = Date.now();
    const awardedMemberId = task.assignmentMode === 'shared'
      ? completedByMemberId
      : task.memberId;
    const awardedMember = awardedMemberId
      ? getMember(familyId, awardedMemberId)
      : null;
    const previousAwardedMemberId = task.completedByMemberId || (
      task.assignmentMode === 'shared' ? '' : task.memberId
    );
    const unusedNextTask = !completed && task.repeatRule !== 'none'
      ? listRecords(familyId, 'tasks').find(
          record =>
            record.previousOccurrenceId === task.id &&
            !record.completed &&
            record.completionStatus !== 'pending_approval'
        )
      : null;
    if (unusedNextTask) {
      database
        .prepare(`
          DELETE FROM family_records
          WHERE family_id = ? AND type = 'tasks' AND id = ?
        `)
        .run(familyId, unusedNextTask.id);
    }
    const updatedTask = upsertRecord(
      familyId,
      'tasks',
      completed
        ? {
            ...task,
            completed: true,
            completionStatus: 'approved',
            completedByMemberId: awardedMember?.id || null,
            completedByName: awardedMember?.name || '',
            completionApprovedByMemberId: actorMemberId || null,
            completionApprovedAt: now,
            completionRequestedByMemberId: null,
            completionRequestedAt: null
          }
        : {
            ...task,
            completed: false,
            completionStatus: 'open',
            completedByMemberId: null,
            completedByName: '',
            completionApprovedByMemberId: null,
            completionApprovedAt: null,
            completionRequestedByMemberId: null,
            completionRequestedAt: null
          },
      { bump: false }
    );
    const member = updateTaskMemberStars(
      familyId,
      task,
      completed ? 1 : -1,
      completed ? awardedMemberId : previousAwardedMemberId
    );
    const nextTask = completed
      ? createNextRecurringTask(familyId, updatedTask)
      : null;
    bumpFamilyVersion(familyId);
    return {
      task: updatedTask,
      member,
      nextTask,
      removedNextTaskId: unusedNextTask?.id || null,
      action: completed ? 'completed' : 'reopened'
    };
  });
}

export function requestTaskApprovalRecord(familyId, taskId, memberId) {
  return withTransaction(() => {
    const task = getRecord(familyId, 'tasks', taskId);
    if (!task) return null;
    if (task.completed) {
      return { task, member: null, action: 'already_completed' };
    }
    const isPending = task.completionStatus === 'pending_approval';
    const updatedTask = upsertRecord(
      familyId,
      'tasks',
      isPending
        ? {
            ...task,
            completionStatus: 'open',
            completedByMemberId: null,
            completedByName: '',
            completionRequestedByMemberId: null,
            completionRequestedAt: null
          }
        : {
            ...task,
            completed: false,
            completionStatus: 'pending_approval',
            completedByMemberId: null,
            completedByName: '',
            completionRequestedByMemberId: memberId,
            completionRequestedAt: Date.now(),
            completionRejectedByMemberId: null,
            completionRejectedAt: null
          },
      { bump: false }
    );
    bumpFamilyVersion(familyId);
    return {
      task: updatedTask,
      member: null,
      action: isPending ? 'approval_cancelled' : 'approval_requested'
    };
  });
}

export function reviewTaskRecord(
  familyId,
  taskId,
  reviewerMemberId,
  approved
) {
  return withTransaction(() => {
    const task = getRecord(familyId, 'tasks', taskId);
    if (!task) return null;
    if (task.completed || task.completionStatus !== 'pending_approval') {
      return { task, member: null, action: 'not_pending' };
    }
    const now = Date.now();
    const updatedTask = upsertRecord(
      familyId,
      'tasks',
      approved
        ? {
            ...task,
            completed: true,
            completionStatus: 'approved',
            completedByMemberId: task.completionRequestedByMemberId,
            completedByName:
              getMember(familyId, task.completionRequestedByMemberId)?.name || '',
            completionApprovedByMemberId: reviewerMemberId,
            completionApprovedAt: now,
            completionRejectedByMemberId: null,
            completionRejectedAt: null
          }
        : {
            ...task,
            completed: false,
            completionStatus: 'open',
            completionRequestedByMemberId: null,
            completionRequestedAt: null,
            completionRejectedByMemberId: reviewerMemberId,
            completionRejectedAt: now
          },
      { bump: false }
    );
    const member = approved
      ? updateTaskMemberStars(
          familyId,
          task,
          1,
          task.assignmentMode === 'shared'
            ? task.completionRequestedByMemberId
            : task.memberId
        )
      : null;
    const nextTask = approved
      ? createNextRecurringTask(familyId, updatedTask)
      : null;
    bumpFamilyVersion(familyId);
    return {
      task: updatedTask,
      member,
      nextTask,
      action: approved ? 'approved' : 'rejected'
    };
  });
}

export function redeemRewardRecord(familyId, rewardId, memberId) {
  return withTransaction(() => {
    const reward = getRecord(familyId, 'rewards', rewardId);
    const memberRow = getMemberAuthRow(familyId, memberId);
    if (!reward || !memberRow) return null;
    const cost = Math.max(0, Number(reward.costStars || 0));
    if (Number(memberRow.stars || 0) < cost) {
      const error = new Error('Nicht genügend Sterne');
      error.statusCode = 409;
      throw error;
    }
    database
      .prepare(`
        UPDATE members SET stars = ?, updated_at = ?
        WHERE family_id = ? AND id = ?
      `)
      .run(Number(memberRow.stars) - cost, Date.now(), familyId, memberId);
    bumpFamilyVersion(familyId);
    return {
      reward,
      member: getMember(familyId, memberId)
    };
  });
}

function importLegacyDatabase() {
  if (getAppMeta('legacy_json_imported_at')) return;
  if (!fs.existsSync(LEGACY_DATABASE_FILE)) return;

  let legacy;
  try {
    legacy = JSON.parse(fs.readFileSync(LEGACY_DATABASE_FILE, 'utf8'));
  } catch (error) {
    console.error('Legacy-Datenbank konnte nicht gelesen werden:', error);
    return;
  }

  const legacyFamilies = Array.isArray(legacy.familiesList)
    ? legacy.familiesList
    : [];
  if (legacyFamilies.length === 0) return;

  withTransaction(() => {
    const now = Date.now();
    legacyFamilies.forEach((family, index) => {
      const familyId = String(family.id || `fam-import-${index + 1}`);
      database
        .prepare(`
          INSERT OR IGNORE INTO families(
            id, name, avatar, badge, password_hash, created_at, updated_at
          )
          VALUES(?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          familyId,
          family.familyName || `Familie ${index + 1}`,
          family.familyAvatar || '',
          family.badge || 'Familie',
          hashSecret(family.password || '1234'),
          now + index,
          now
        );

      database
        .prepare(`
          INSERT OR IGNORE INTO family_versions(family_id, version, updated_at)
          VALUES(?, 1, ?)
        `)
        .run(familyId, now);

      const familyMembers = Array.isArray(family.members)
        ? family.members
        : (index === 0 && Array.isArray(legacy.members) ? legacy.members : []);
      familyMembers.forEach(member => {
        const exists = database
          .prepare('SELECT 1 FROM members WHERE id = ?')
          .get(member.id);
        if (!exists) {
          insertMember(
            familyId,
            {
              ...member,
              role: inferRoleType(member.role, member.name),
              position: inferPosition(member)
            },
            now
          );
        }
      });
    });

    const fallbackFamilyId =
      legacy.familyAccount?.id ||
      legacyFamilies[0]?.id;
    for (const type of RECORD_TYPES) {
      const records = Array.isArray(legacy[type]) ? legacy[type] : [];
      records.forEach(record => {
        const familyId = record.familyId || fallbackFamilyId;
        if (!familyId || !getFamily(familyId)) return;
        upsertRecord(
          familyId,
          type,
          normalizeRecord(type, record, familyId),
          { bump: false }
        );
      });
    }

    setAppMeta('legacy_json_imported_at', new Date().toISOString());
  });
}

if (process.env.DISABLE_LEGACY_IMPORT !== 'true') {
  importLegacyDatabase();
}

export { DATABASE_FILE, RECORD_TYPES, database };
