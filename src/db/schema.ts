import { bigint, char, datetime, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  googleId: varchar("google_id", { length: 128 }),
  role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  uniqueIndex("users_google_id_unique").on(table.googleId),
]);

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: char("user_id", { length: 36 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
]);

export const templates = mysqlTable("templates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: char("code", { length: 5 }).notNull(),
  version: int("version").notNull().default(1),
  category: varchar("category", { length: 32 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  manifest: json("manifest").notNull(),
  isActive: int("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [uniqueIndex("templates_code_unique").on(table.code)]);

export const invitations = mysqlTable("invitations", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("user_id", { length: 36 }),
  title: varchar("title", { length: 120 }).notNull().default("Undangan baru"),
  editTokenHash: char("edit_token_hash", { length: 64 }).notNull(),
  templateId: varchar("template_id", { length: 64 }).notNull(),
  templateVersion: int("template_version").notNull(),
  themeId: varchar("theme_id", { length: 64 }).notNull(),
  styleOverrides: json("style_overrides").notNull(),
  status: mysqlEnum("status", ["draft", "published", "custom", "archived"]).notNull().default("draft"),
  publishMode: mysqlEnum("publish_mode", ["path", "subdomain", "custom_domain"]),
  slug: varchar("slug", { length: 63 }),
  subdomain: varchar("subdomain", { length: 63 }),
  recoveryCodeHash: char("recovery_code_hash", { length: 64 }),
  publishedAt: datetime("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("invitations_slug_unique").on(table.slug),
  uniqueIndex("invitations_subdomain_unique").on(table.subdomain),
  index("invitations_user_updated_idx").on(table.userId, table.updatedAt),
]);

export const invitationSections = mysqlTable("invitation_sections", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  sectionOrder: int("section_order").notNull(),
  enabled: int("enabled").notNull().default(1),
  data: json("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [uniqueIndex("invitation_sections_order_unique").on(table.invitationId, table.sectionOrder)]);

export const invitationAssets = mysqlTable("invitation_assets", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  kind: mysqlEnum("kind", ["image", "audio"]).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("invitation_assets_invitation_id_index").on(table.invitationId)]);

export const domainPublishRequests = mysqlTable("domain_publish_requests", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  userId: char("user_id", { length: 36 }).notNull(),
  domain: varchar("domain", { length: 253 }).notNull(),
  tld: mysqlEnum("tld", ["com", "id", "co", "space"]).notNull(),
  status: mysqlEnum("status", ["requested", "processing", "registered", "rejected", "cancelled"]).notNull().default("requested"),
  availabilitySource: mysqlEnum("availability_source", ["rdap", "whois"]).notNull(),
  availabilityCheckedAt: datetime("availability_checked_at").notNull(),
  templatePrice: int("template_price").notNull(),
  additionalServiceFee: int("additional_service_fee"),
  estimatedTotal: int("estimated_total"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("domain_publish_requests_invitation_unique").on(table.invitationId),
  uniqueIndex("domain_publish_requests_domain_unique").on(table.domain),
  index("domain_publish_requests_user_status_idx").on(table.userId, table.status),
]);

export const wishes = mysqlTable("wishes", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  guestName: varchar("guest_name", { length: 120 }).notNull(),
  attendance: mysqlEnum("attendance", ["hadir", "tidak_hadir", "masih_ragu"]).notNull().default("masih_ragu"),
  message: varchar("message", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [index("wishes_invitation_id_index").on(table.invitationId)]);

export const invitationGuests = mysqlTable("invitation_guests", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  group: varchar("group", { length: 60 }).notNull().default("Umum"),
  status: mysqlEnum("status", ["pending", "sent"]).notNull().default("pending"),
  sentAt: datetime("sent_at"),
  openedAt: datetime("opened_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("invitation_guests_invitation_id_idx").on(table.invitationId),
  index("invitation_guests_invitation_slug_idx").on(table.invitationId, table.slug),
]);

export const invitationCollaborators = mysqlTable("invitation_collaborators", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  userId: char("user_id", { length: 36 }),
  email: varchar("email", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["editor", "viewer"]).notNull().default("editor"),
  inviteTokenHash: varchar("invite_token_hash", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired", "revoked"]).notNull().default("pending"),
  invitedBy: char("invited_by", { length: 36 }).notNull(),
  expiresAt: datetime("expires_at"),
  acceptedAt: datetime("accepted_at"),
  declinedAt: datetime("declined_at"),
  revokedAt: datetime("revoked_at"),
  lastSeenAt: datetime("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  uniqueIndex("invitation_collaborators_unique").on(table.invitationId, table.email),
  index("invitation_collaborators_user_id_idx").on(table.userId),
  index("invitation_collaborators_email_idx").on(table.email),
  index("invitation_collaborators_status_idx").on(table.status),
  index("invitation_collaborators_token_hash_idx").on(table.inviteTokenHash),
]);

export const invitationActivityLogs = mysqlTable("invitation_activity_logs", {
  id: char("id", { length: 36 }).primaryKey(),
  invitationId: char("invitation_id", { length: 36 }).notNull(),
  userId: char("user_id", { length: 36 }),
  action: varchar("action", { length: 64 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("invitation_activity_logs_invitation_id_idx").on(table.invitationId),
  index("invitation_activity_logs_action_idx").on(table.action),
]);

export const emailOutbox = mysqlTable("email_outbox", {
  id: char("id", { length: 36 }).primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).notNull().default("pending"),
  attempts: int("attempts").notNull().default(0),
  lastError: text("last_error"),
  sentAt: datetime("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("email_outbox_status_idx").on(table.status),
  index("email_outbox_recipient_idx").on(table.recipient),
]);
export const invitationCollaborationSnapshots = mysqlTable("invitation_collaboration_snapshots", {
  id: varchar("id", { length: 36 }).primaryKey(),
  invitationId: varchar("invitation_id", { length: 36 }).notNull(),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  schemaVersion: int("schema_version").notNull().default(1),
  snapshot: text("snapshot").notNull(),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("snap_invitation_idx").on(table.invitationId),
  index("snap_revision_idx").on(table.invitationId, table.revision),
]);

