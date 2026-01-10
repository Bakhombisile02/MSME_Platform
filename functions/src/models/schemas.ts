/**
 * Firestore Collection Schemas
 * 
 * This file defines TypeScript interfaces for all Firestore collections,
 * mirroring the original Sequelize models with Firestore-appropriate structure.
 */

import { Timestamp } from 'firebase-admin/firestore';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface BaseDocument {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null; // Soft delete support
}

// =============================================================================
// ADMIN
// =============================================================================

export interface Admin extends BaseDocument {
  name: string;
  email: string;
  password: string; // bcrypt hashed
  role: 'admin' | 'user';
  profileImage?: string;
}

// =============================================================================
// MSME BUSINESS
// =============================================================================

export type VerificationStatus = 1 | 2 | 3; // 1=pending, 2=approved, 3=rejected
export type OwnershipType = 'sole_proprietorship' | 'partnership' | 'company' | 'cooperative' | 'other';

export interface MSMEBusiness extends BaseDocument {
  // Firebase Auth UID
  userId: string;
  
  // Basic Info
  name_of_organization: string;
  name_of_organization_lower: string; // Lowercase for case-insensitive search
  trading_name?: string;
  business_category_id: string;
  business_sub_category_id?: string;
  
  // Contact
  email_address: string;
  phone_number: string;
  website?: string;
  
  // Location
  physical_address: string;
  postal_address?: string;
  region: string;
  city?: string;
  
  // Business Details
  registration_number?: string;
  tin_number?: string;
  year_established?: number;
  number_of_employees?: number;
  annual_turnover?: string;
  business_description?: string;
  
  // Ownership
  ownership_type?: OwnershipType;
  owner_gender_summary?: string; // e.g., "2M,1F" for 2 male, 1 female owners
  
  // Media
  business_image?: string;
  business_profile?: string;
  incorporation_certificate?: string;
  
  // Status
  is_verified: VerificationStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: Timestamp;
  
  // Password Reset (OTP)
  reset_otp?: string;
  reset_otp_expires?: Timestamp;
  reset_token?: string;
  reset_token_expires?: Timestamp;
  
  // Password fields (for migrated users - new users use Firebase Auth)
  password?: string;       // Legacy plaintext (should be removed after migration)
  password_hash?: string;  // bcrypt hash
  
  // Denormalized data for queries
  category_name?: string;
  sub_category_name?: string;
}

export interface Director extends BaseDocument {
  business_id: string;
  name: string;
  surname: string;
  id_number?: string;
  nationality?: string;
  gender?: 'Male' | 'Female' | 'Other';
  phone_number?: string;
  email?: string;
}

export interface BusinessOwner extends BaseDocument {
  business_id: string;
  gender: 'Male' | 'Female';
}

// =============================================================================
// BUSINESS CATEGORIES
// =============================================================================

export interface BusinessCategory extends BaseDocument {
  category_name: string;
  category_image?: string;
  description?: string;
  businessCount?: number; // Denormalized count
}

export interface BusinessSubCategory extends BaseDocument {
  sub_category_name: string;
  category_id: string;
  category_name?: string; // Denormalized
  description?: string;
}

// =============================================================================
// SERVICE PROVIDERS
// =============================================================================

export interface ServiceProvider extends BaseDocument {
  service_name: string;
  category_id: string;
  category_name?: string; // Denormalized
  description?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  region?: string;
  service_image?: string;
}

export interface ServiceProviderCategory extends BaseDocument {
  category_name: string;
  category_image?: string;
  description?: string;
  providerCount?: number; // Denormalized count
}

// =============================================================================
// CONTENT MANAGEMENT
// =============================================================================

export interface Blog extends BaseDocument {
  title: string;
  slug?: string;
  content: string; // HTML content
  excerpt?: string;
  blog_image?: string;
  author?: string;
  published: boolean;
  viewCount?: number;
}

export interface FAQ extends BaseDocument {
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface HomeBanner extends BaseDocument {
  title: string;
  subtitle?: string;
  banner_image: string;
  link_url?: string;
  order?: number;
  is_active: boolean;
}

export interface Download extends BaseDocument {
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  downloadCount?: number;
}

export interface PartnersLogo extends BaseDocument {
  name: string;
  logo_image: string;
  website_url?: string;
  order?: number;
}

export interface TeamMember extends BaseDocument {
  name: string;
  position: string;
  team_image?: string;
  bio?: string;
  email?: string;
  linkedin?: string;
  order?: number;
}

// =============================================================================
// USER SUBMISSIONS
// =============================================================================

export interface Subscriber extends BaseDocument {
  email: string;
  subscribed_at: Timestamp;
  is_active: boolean;
}

export interface Feedback extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  rating?: number;
  is_read: boolean;
}

// =============================================================================
// HELP DESK / TICKETS
// =============================================================================

export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket extends BaseDocument {
  ticket_id: string; // Human-readable ID like "TKT-2026-0001"
  
  // Submitter info
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
  
  // Ticket details
  subject: string;
  message: string;
  category_id?: string;
  category_name?: string; // Denormalized
  
  // Status
  status: TicketStatus;
  priority: TicketPriority;
  is_read?: boolean;
  
  // Assignment
  assigned_to?: string; // Admin ID
  assigned_to_name?: string; // Denormalized
  assigned_at?: Timestamp;
  
  // Response tracking
  response_count?: number;
  first_response_at?: Timestamp;
  last_activity_at?: Timestamp;
  due_date?: Timestamp;
  
  // Resolution
  resolved_at?: Timestamp;
  resolution_notes?: string;
  
  // Customer satisfaction
  satisfaction_rating?: number; // 1-5
  
  // For authenticated users
  userId?: string;
}

export interface TicketResponse extends BaseDocument {
  ticket_id: string;
  message: string;
  responder_type: 'admin' | 'user' | 'customer' | 'system';
  responder_id?: string;
  responder_name?: string;
  responder?: { name?: string; email?: string }; // Populated responder info
  attachments?: string[]; // Storage URLs
  is_internal: boolean; // Internal notes not visible to user
  is_internal_note?: boolean; // Alias for is_internal
  email_sent?: boolean;
  email_sent_at?: Timestamp;
}

export interface TicketAttachment extends BaseDocument {
  ticket_id: string;
  response_id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
}

export interface TicketCategory extends BaseDocument {
  name: string;
  description?: string;
  color?: string;
  sla_hours?: number;
  is_active: boolean;
  order?: number;
  display_order?: number;
  ticketCount?: number; // Denormalized
  ticket_count?: number; // Alias
}

// =============================================================================
// ANALYTICS / COUNTERS
// =============================================================================

export interface AnalyticsSnapshot extends BaseDocument {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period: string; // e.g., "2026-01-09", "2026-W02", "2026-01", "2026"
  
  // Counts
  total_businesses: number;
  pending_businesses: number;
  approved_businesses: number;
  rejected_businesses: number;
  
  // By category
  businesses_by_category: Record<string, number>;
  businesses_by_region: Record<string, number>;
  
  // Gender stats
  male_owned: number;
  female_owned: number;
  mixed_ownership: number;
  
  // Service providers
  total_service_providers: number;
  
  // User activity
  new_registrations: number;
  new_subscribers: number;
  new_feedback: number;
  new_tickets: number;
}

export interface Counter {
  count: number;
  lastUpdated: Timestamp;
}

// =============================================================================
// COLLECTION NAMES
// =============================================================================

export const COLLECTIONS = {
  ADMINS: 'admins',
  MSME_BUSINESSES: 'msme_businesses',
  DIRECTORS: 'directors', // Subcollection of msme_businesses
  BUSINESS_OWNERS: 'owners', // Subcollection of msme_businesses
  BUSINESS_CATEGORIES: 'business_categories',
  BUSINESS_SUB_CATEGORIES: 'business_sub_categories',
  SERVICE_PROVIDERS: 'service_providers',
  SERVICE_PROVIDER_CATEGORIES: 'service_provider_categories',
  BLOGS: 'blogs',
  FAQS: 'faqs',
  HOME_BANNERS: 'home_banners',
  DOWNLOADS: 'downloads',
  PARTNERS_LOGOS: 'partners_logos',
  TEAMS: 'teams',
  SUBSCRIBERS: 'subscribers',
  FEEDBACK: 'feedback',
  TICKETS: 'tickets',
  TICKET_RESPONSES: 'responses', // Subcollection of tickets
  TICKET_ATTACHMENTS: 'attachments', // Subcollection of tickets
  TICKET_CATEGORIES: 'ticket_categories',
  ANALYTICS: 'analytics',
  COUNTERS: 'counters',
} as const;
