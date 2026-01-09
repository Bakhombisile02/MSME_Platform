/**
 * MSME Platform - Cloud Functions Entry Point
 * 
 * This is the main entry point for all Firebase Cloud Functions.
 * It initializes Firebase Admin SDK and exports all API endpoints.
 */

import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as functions from 'firebase-functions/v2';

// Initialize Firebase Admin
initializeApp();

// Set global options
setGlobalOptions({
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
});

// =============================================================================
// HTTP API FUNCTIONS
// =============================================================================

// Import Express app
import { app } from './api';

// Export main API as HTTP function with public access
export const api = functions.https.onRequest(
  { 
    cors: true,
    invoker: 'public',  // Allow unauthenticated access
  },
  app
);

// =============================================================================
// FIRESTORE TRIGGERS
// =============================================================================

import { 
  onMSMEBusinessCreated, 
  onMSMEBusinessUpdated,
  onMSMEBusinessDeleted 
} from './triggers/msmeBusiness.triggers';

import {
  onTicketCreated,
  onTicketUpdated,
} from './triggers/ticket.triggers';

// MSME Business triggers
export const msmeBusinessCreated = onMSMEBusinessCreated;
export const msmeBusinessUpdated = onMSMEBusinessUpdated;
export const msmeBusinessDeleted = onMSMEBusinessDeleted;

// Ticket triggers
export const ticketCreated = onTicketCreated;
export const ticketUpdated = onTicketUpdated;

// =============================================================================
// SCHEDULED FUNCTIONS
// =============================================================================

import { 
  generateDailyAnalytics,
  cleanupExpiredOTPs,
  generateMonthlyAnalytics,
} from './scheduled/analytics.scheduled';

export const dailyAnalytics = generateDailyAnalytics;
export const monthlyAnalytics = generateMonthlyAnalytics;
export const otpCleanup = cleanupExpiredOTPs;

// =============================================================================
// CALLABLE FUNCTIONS (for Algolia search)
// =============================================================================

import {
  searchBusinesses,
  getSearchSuggestions,
  getPopularSearches,
} from './callable/search.callable';

export const search = searchBusinesses;
export const suggestions = getSearchSuggestions;
export const popularSearches = getPopularSearches;
