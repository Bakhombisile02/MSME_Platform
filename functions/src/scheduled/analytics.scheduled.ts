/**
 * Scheduled Functions
 * 
 * Background tasks that run on a schedule
 */

import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, AnalyticsSnapshot } from '../models/schemas';
import { FirestoreRepo } from '../services/FirestoreRepository';

const db = getFirestore();

/**
 * Generate daily analytics snapshot
 * Runs every day at midnight
 */
export const generateDailyAnalytics = functions.scheduler.onSchedule(
  {
    schedule: '0 0 * * *', // Midnight every day
    timeZone: 'Africa/Johannesburg', // Eswatini timezone
  },
  async (event) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const period = yesterday.toISOString().split('T')[0];
      
      console.log(`Generating daily analytics for ${period}`);
      
      // Get all counts
      const [
        totalBusinesses,
        pendingBusinesses,
        approvedBusinesses,
        rejectedBusinesses,
        totalServiceProviders,
      ] = await Promise.all([
        FirestoreRepo.count(COLLECTIONS.MSME_BUSINESSES, {}),
        FirestoreRepo.countByField(COLLECTIONS.MSME_BUSINESSES, 'is_verified', 1),
        FirestoreRepo.countByField(COLLECTIONS.MSME_BUSINESSES, 'is_verified', 2),
        FirestoreRepo.countByField(COLLECTIONS.MSME_BUSINESSES, 'is_verified', 3),
        FirestoreRepo.count(COLLECTIONS.SERVICE_PROVIDERS, {}),
      ]);
      
      // Get businesses by category
      const categoriesSnapshot = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES)
        .where('deletedAt', '==', null)
        .get();
      
      const businessesByCategory: Record<string, number> = {};
      for (const doc of categoriesSnapshot.docs) {
        businessesByCategory[doc.data().category_name] = doc.data().businessCount || 0;
      }
      
      // Get businesses by region
      const businessSnapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('deletedAt', '==', null)
        .where('is_verified', '==', 2)
        .get();
      
      const businessesByRegion: Record<string, number> = {};
      let maleOwned = 0;
      let femaleOwned = 0;
      let mixedOwnership = 0;
      
      businessSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Region
        const region = data.region || 'Unknown';
        businessesByRegion[region] = (businessesByRegion[region] || 0) + 1;
        
        // Gender
        const summary = data.owner_gender_summary || '';
        if (summary.includes('M') && summary.includes('F')) {
          mixedOwnership++;
        } else if (summary.includes('M')) {
          maleOwned++;
        } else if (summary.includes('F')) {
          femaleOwned++;
        }
      });
      
      // Get daily counters
      const registrationsDoc = await db.collection(COLLECTIONS.COUNTERS)
        .doc(`registrations_${period}`)
        .get();
      const subscribersDoc = await db.collection(COLLECTIONS.COUNTERS)
        .doc(`subscribers_${period}`)
        .get();
      const feedbackDoc = await db.collection(COLLECTIONS.COUNTERS)
        .doc(`feedback_${period}`)
        .get();
      const ticketsDoc = await db.collection(COLLECTIONS.COUNTERS)
        .doc(`tickets_${period}`)
        .get();
      
      // Create analytics snapshot
      const snapshot: Omit<AnalyticsSnapshot, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> = {
        type: 'daily',
        period,
        total_businesses: totalBusinesses,
        pending_businesses: pendingBusinesses,
        approved_businesses: approvedBusinesses,
        rejected_businesses: rejectedBusinesses,
        businesses_by_category: businessesByCategory,
        businesses_by_region: businessesByRegion,
        male_owned: maleOwned,
        female_owned: femaleOwned,
        mixed_ownership: mixedOwnership,
        total_service_providers: totalServiceProviders,
        new_registrations: registrationsDoc.data()?.count || 0,
        new_subscribers: subscribersDoc.data()?.count || 0,
        new_feedback: feedbackDoc.data()?.count || 0,
        new_tickets: ticketsDoc.data()?.count || 0,
      };
      
      await FirestoreRepo.create(COLLECTIONS.ANALYTICS, snapshot);
      
      console.log(`Daily analytics generated for ${period}`);
    } catch (error) {
      console.error('Error generating daily analytics:', error);
    }
  }
);

/**
 * Cleanup expired OTPs and reset tokens
 * Runs every hour
 */
export const cleanupExpiredOTPs = functions.scheduler.onSchedule(
  {
    schedule: '0 * * * *', // Every hour
    timeZone: 'Africa/Johannesburg',
  },
  async (event) => {
    try {
      const now = Timestamp.now();
      const BATCH_LIMIT = 500;
      
      // Find businesses with expired OTPs
      const expiredOtpSnapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('reset_otp_expires', '<', now)
        .where('reset_otp', '!=', null)
        .get();
      
      // Find businesses with expired reset tokens
      const expiredTokenSnapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
        .where('reset_token_expires', '<', now)
        .where('reset_token', '!=', null)
        .get();
      
      let cleanupCount = 0;
      let batch = db.batch();
      let opCount = 0;
      
      for (const doc of expiredOtpSnapshot.docs) {
        batch.update(doc.ref, {
          reset_otp: null,
          reset_otp_expires: null,
        });
        opCount++;
        cleanupCount++;
        
        // Commit and reset batch when limit reached
        if (opCount >= BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      }
      
      for (const doc of expiredTokenSnapshot.docs) {
        batch.update(doc.ref, {
          reset_token: null,
          reset_token_expires: null,
        });
        opCount++;
        cleanupCount++;
        
        // Commit and reset batch when limit reached
        if (opCount >= BATCH_LIMIT) {
          await batch.commit();
          batch = db.batch();
          opCount = 0;
        }
      }
      
      // Commit remaining operations
      if (opCount > 0) {
        await batch.commit();
      }
      
      if (cleanupCount > 0) {
        console.log(`Cleaned up ${cleanupCount} expired OTPs/tokens`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }
);

/**
 * Generate monthly analytics (runs on 1st of each month)
 */
export const generateMonthlyAnalytics = functions.scheduler.onSchedule(
  {
    schedule: '0 1 1 * *', // 1 AM on the 1st of each month
    timeZone: 'Africa/Johannesburg',
  },
  async (event) => {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const period = lastMonth.toISOString().slice(0, 7); // YYYY-MM format
      
      console.log(`Generating monthly analytics for ${period}`);
      
      // Aggregate daily snapshots for the month
      const dailySnapshots = await db.collection(COLLECTIONS.ANALYTICS)
        .where('type', '==', 'daily')
        .where('period', '>=', `${period}-01`)
        .where('period', '<=', `${period}-31`)
        .orderBy('period', 'asc')
        .get();
      
      if (dailySnapshots.empty) {
        console.log(`No daily snapshots found for ${period}`);
        return;
      }
      
      // Aggregate data
      let totalNewRegistrations = 0;
      let totalNewSubscribers = 0;
      let totalNewFeedback = 0;
      let totalNewTickets = 0;
      
      dailySnapshots.docs.forEach(doc => {
        const data = doc.data();
        totalNewRegistrations += data.new_registrations || 0;
        totalNewSubscribers += data.new_subscribers || 0;
        totalNewFeedback += data.new_feedback || 0;
        totalNewTickets += data.new_tickets || 0;
      });
      
      // Get latest totals from most recent daily snapshot
      const latestDaily = dailySnapshots.docs[dailySnapshots.docs.length - 1].data();
      
      const monthlySnapshot = {
        type: 'monthly',
        period,
        total_businesses: latestDaily.total_businesses,
        pending_businesses: latestDaily.pending_businesses,
        approved_businesses: latestDaily.approved_businesses,
        rejected_businesses: latestDaily.rejected_businesses,
        businesses_by_category: latestDaily.businesses_by_category,
        businesses_by_region: latestDaily.businesses_by_region,
        male_owned: latestDaily.male_owned,
        female_owned: latestDaily.female_owned,
        mixed_ownership: latestDaily.mixed_ownership,
        total_service_providers: latestDaily.total_service_providers,
        new_registrations: totalNewRegistrations,
        new_subscribers: totalNewSubscribers,
        new_feedback: totalNewFeedback,
        new_tickets: totalNewTickets,
      };
      
      await FirestoreRepo.create(COLLECTIONS.ANALYTICS, monthlySnapshot);
      
      console.log(`Monthly analytics generated for ${period}`);
    } catch (error) {
      console.error('Error generating monthly analytics:', error);
    }
  }
);
