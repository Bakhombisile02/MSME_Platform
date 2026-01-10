/**
 * Callable Functions for Search
 * 
 * Provides search functionality using Algolia
 */

import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, MSMEBusiness } from '../models/schemas';

const db = getFirestore();

// Rate limit collection for search requests
const RATE_LIMIT_COLLECTION = 'search_rate_limits';
const MAX_REQUESTS_PER_MINUTE = 30;

/**
 * Check and update rate limit for a caller
 */
async function checkRateLimit(callerId: string): Promise<boolean> {
  const now = Timestamp.now();
  const oneMinuteAgo = Timestamp.fromMillis(now.toMillis() - 60000);
  
  const rateLimitRef = db.collection(RATE_LIMIT_COLLECTION).doc(callerId);
  
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(rateLimitRef);
    const data = doc.data();
    
    if (!data || data.windowStart.toMillis() < oneMinuteAgo.toMillis()) {
      // Start new window
      transaction.set(rateLimitRef, { windowStart: now, count: 1 });
      return true;
    }
    
    if (data.count >= MAX_REQUESTS_PER_MINUTE) {
      return false; // Rate limited
    }
    
    transaction.update(rateLimitRef, { count: data.count + 1 });
    return true;
  });
}

/**
 * Search businesses using Algolia
 * Falls back to Firestore prefix search if Algolia is not configured
 */
export const searchBusinesses = functions.https.onCall(
  async (request) => {
    const { query, filters, page = 1, limit = 20, cursor } = request.data;
    
    // Rate limiting - use auth uid if available, otherwise use a hash of the request
    const callerId = request.auth?.uid || 'anonymous';
    const isAllowed = await checkRateLimit(callerId);
    if (!isAllowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted', 
        'Too many requests. Please try again later.'
      );
    }
    
    if (!query || query.length < 2) {
      return { results: [], total: 0, page, nextCursor: null };
    }
    
    try {
      // Fallback: Firestore prefix search
      const searchTerm = query.toLowerCase();
      
      // Fetch extra results to account for in-memory filtering
      // If filters are applied, we may need more results to fill the page
      const hasFilters = !!(filters?.region || filters?.category);
      const fetchMultiplier = hasFilters ? 3 : 1;
      const fetchLimit = Math.min(limit * fetchMultiplier, 100);
      
      let firestoreQuery = db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('deletedAt', '==', null)
        .where('is_verified', '==', 2)
        .where('name_of_organization_lower', '>=', searchTerm)
        .where('name_of_organization_lower', '<=', searchTerm + '\uf8ff')
        .orderBy('name_of_organization_lower')
        .limit(fetchLimit);
      
      // Cursor-based pagination - if cursor provided, start after that document
      if (cursor) {
        const cursorDoc = await db.collection(COLLECTIONS.MSME_BUSINESSES).doc(cursor).get();
        if (cursorDoc.exists) {
          firestoreQuery = firestoreQuery.startAfter(cursorDoc);
        }
      }
      
      const snapshot = await firestoreQuery.get();
      
      let results = snapshot.docs.map(doc => {
        const data = doc.data() as MSMEBusiness;
        return {
          id: doc.id,
          name: data.name_of_organization,
          category: data.category_name,
          region: data.region,
          description: data.business_description,
          image: data.business_image,
        };
      });
      
      // Apply additional filters in memory (Firestore limitation)
      if (filters?.region) {
        results = results.filter(r => r.region === filters.region);
      }
      if (filters?.category) {
        results = results.filter(r => r.category === filters.category);
      }
      
      // Calculate offset-based pagination
      const offset = (page - 1) * limit;
      const paginatedResults = results.slice(offset, offset + limit);
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / limit);
      const hasMore = page < totalPages;
      
      return { 
        results: paginatedResults, 
        total: totalResults,
        page,
        totalPages,
        hasMore,
        note: 'Using Firestore prefix search. Enable Algolia for full-text search.'
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new functions.https.HttpsError('internal', 'Search failed');
    }
  }
);

/**
 * Get search suggestions for autocomplete
 */
export const getSearchSuggestions = functions.https.onCall(
  async (request) => {
    const { query } = request.data;
    
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }
    
    try {
      const searchTerm = query.toLowerCase();
      
      // Get business name suggestions
      const businessSnapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('deletedAt', '==', null)
        .where('is_verified', '==', 2)
        .where('name_of_organization_lower', '>=', searchTerm)
        .where('name_of_organization_lower', '<=', searchTerm + '\uf8ff')
        .limit(5)
        .get();
      
      const businessSuggestions = businessSnapshot.docs.map(doc => ({
        type: 'business',
        text: doc.data().name_of_organization,
        id: doc.id,
      }));
      
      // Get category suggestions
      const categorySnapshot = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES)
        .where('deletedAt', '==', null)
        .get();
      
      const categorySuggestions = categorySnapshot.docs
        .filter(doc => 
          doc.data().category_name.toLowerCase().includes(searchTerm)
        )
        .slice(0, 3)
        .map(doc => ({
          type: 'category',
          text: doc.data().category_name,
          id: doc.id,
        }));
      
      return {
        suggestions: [...businessSuggestions, ...categorySuggestions],
      };
    } catch (error) {
      console.error('Suggestions error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get suggestions');
    }
  }
);

/**
 * Get popular searches
 * Returns most searched terms (stored from search analytics)
 */
export const getPopularSearches = functions.https.onCall(
  async (request) => {
    try {
      // Get popular search terms from analytics
      const snapshot = await db.collection('search_analytics')
        .orderBy('count', 'desc')
        .limit(10)
        .get();
      
      if (snapshot.empty) {
        // Return default popular categories if no search data
        const categories = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES)
          .where('deletedAt', '==', null)
          .orderBy('businessCount', 'desc')
          .limit(5)
          .get();
        
        return {
          searches: categories.docs.map(doc => doc.data().category_name),
        };
      }
      
      return {
        searches: snapshot.docs.map(doc => doc.data().term),
      };
    } catch (error) {
      console.error('Popular searches error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get popular searches');
    }
  }
);
