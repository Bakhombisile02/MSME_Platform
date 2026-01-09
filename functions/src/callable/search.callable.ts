/**
 * Callable Functions for Search
 * 
 * Provides search functionality using Algolia
 */

import * as functions from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS, MSMEBusiness } from '../models/schemas';

const db = getFirestore();

// Algolia configuration (to be set via Firebase environment)
// const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
// const ALGOLIA_SEARCH_KEY = process.env.ALGOLIA_SEARCH_KEY;

/**
 * Search businesses using Algolia
 * Falls back to Firestore prefix search if Algolia is not configured
 */
export const searchBusinesses = functions.https.onCall(
  async (request) => {
    const { query, filters, page = 1, limit = 20 } = request.data;
    
    if (!query || query.length < 2) {
      return { results: [], total: 0 };
    }
    
    try {
      // TODO: Implement Algolia search
      // const algoliasearch = require('algoliasearch');
      // const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
      // const index = client.initIndex('msme_businesses');
      // 
      // const searchParams: any = {
      //   query,
      //   page: page - 1,
      //   hitsPerPage: limit,
      // };
      // 
      // if (filters) {
      //   const filterStrings = [];
      //   if (filters.region) filterStrings.push(`region:${filters.region}`);
      //   if (filters.category) filterStrings.push(`category_name:${filters.category}`);
      //   searchParams.filters = filterStrings.join(' AND ');
      // }
      // 
      // const { hits, nbHits } = await index.search(searchParams);
      // return { results: hits, total: nbHits };
      
      // Fallback: Firestore prefix search
      const searchTerm = query.toLowerCase();
      
      let firestoreQuery = db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('deletedAt', '==', null)
        .where('is_verified', '==', 2)
        .where('name_of_organization_lower', '>=', searchTerm)
        .where('name_of_organization_lower', '<=', searchTerm + '\uf8ff')
        .limit(limit);
      
      const snapshot = await firestoreQuery.get();
      
      const results = snapshot.docs.map(doc => {
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
      let filteredResults = results;
      if (filters?.region) {
        filteredResults = filteredResults.filter(r => r.region === filters.region);
      }
      if (filters?.category) {
        filteredResults = filteredResults.filter(r => r.category === filters.category);
      }
      
      return { 
        results: filteredResults, 
        total: filteredResults.length,
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
