import {
  pgTable,
  uuid,
  text,
  timestamp,
  real,
  integer,
  pgEnum,
  check,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const certAgencyEnum = pgEnum("cert_agency", [
  "PADI",
  "SSI",
  "NAUI",
  "BSAC",
  "CMAS",
  "SDI",
  "TDI",
  "RAID",
  "OTHER",
]);

export const userRoleEnum = pgEnum("user_role", ["diver", "pro", "admin"]);

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const accessTypeEnum = pgEnum("access_type", [
  "shore",
  "boat",
  "both",
]);

// Users
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    certAgency: certAgencyEnum("cert_agency").notNull(),
    certNumber: text("cert_number").notNull(),
    certLevel: text("cert_level").notNull(),
    role: userRoleEnum("role").notNull().default("diver"),
    proRequestedAt: timestamp("pro_requested_at", { withTimezone: true }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_cert_agency_number_idx").on(
      table.certAgency,
      table.certNumber
    ),
  ]
);

// Dive Sites — pro-created only
export const diveSites = pgTable(
  "dive_sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    country: text("country").notNull(),
    region: text("region").notNull(),
    difficulty: difficultyEnum("difficulty"),
    accessType: accessTypeEnum("access_type"),
    maxDepthM: real("max_depth_m"),
    typicalVisibilityM: real("typical_visibility_m"),
    siteTypes: text("site_types").array(), // wall, reef, wreck, cave, drift, muck, pinnacle, shore, deep
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("dive_sites_slug_idx").on(table.slug),
    index("dive_sites_country_region_idx").on(table.country, table.region),
    index("dive_sites_created_by_idx").on(table.createdBy),
  ]
);

// Similarities — the core comparison entity
export const similarities = pgTable(
  "similarities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteAId: uuid("site_a_id")
      .notNull()
      .references(() => diveSites.id, { onDelete: "cascade" }),
    siteBId: uuid("site_b_id")
      .notNull()
      .references(() => diveSites.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    pelagicRating: integer("pelagic_rating"),
    macroRating: integer("macro_rating"),
    landscapeRating: integer("landscape_rating"),
    currentsRating: integer("currents_rating"),
    visibilityRating: integer("visibility_rating"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("similarities_site_a_idx").on(table.siteAId),
    index("similarities_site_b_idx").on(table.siteBId),
    index("similarities_created_by_idx").on(table.createdBy),
    check(
      "at_least_one_rating",
      sql`${table.pelagicRating} IS NOT NULL OR ${table.macroRating} IS NOT NULL OR ${table.landscapeRating} IS NOT NULL OR ${table.currentsRating} IS NOT NULL OR ${table.visibilityRating} IS NOT NULL`
    ),
  ]
);

// Images
export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => profiles.id),
    diveSiteId: uuid("dive_site_id").references(() => diveSites.id, {
      onDelete: "cascade",
    }),
    similarityId: uuid("similarity_id").references(() => similarities.id, {
      onDelete: "cascade",
    }),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("images_dive_site_idx").on(table.diveSiteId),
    index("images_similarity_idx").on(table.similarityId),
  ]
);

// Description suggestions
export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "pending",
  "approved",
  "rejected",
]);

export const siteDescriptionSuggestions = pgTable(
  "site_description_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => diveSites.id, { onDelete: "cascade" }),
    suggestedBy: uuid("suggested_by")
      .notNull()
      .references(() => profiles.id),
    currentDescription: text("current_description").notNull(),
    suggestedDescription: text("suggested_description").notNull(),
    status: suggestionStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("suggestions_site_idx").on(table.siteId),
    index("suggestions_status_idx").on(table.status),
  ]
);

// Type exports for use in application code
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type DiveSite = typeof diveSites.$inferSelect;
export type NewDiveSite = typeof diveSites.$inferInsert;
export type Similarity = typeof similarities.$inferSelect;
export type NewSimilarity = typeof similarities.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type SiteDescriptionSuggestion = typeof siteDescriptionSuggestions.$inferSelect;
