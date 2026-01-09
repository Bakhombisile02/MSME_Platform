/**
 * MSME Business Firestore Triggers
 * 
 * Handles side effects when businesses are created, updated, or deleted
 */

import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, MSMEBusiness, BusinessCategory } from '../models/schemas';
import { FirestoreRepo } from '../services/FirestoreRepository';

const db = getFirestore();

/**
 * When a new MSME business is created
 * - Update category business count
 * - Update analytics counters
 */
export const onMSMEBusinessCreated = functions.firestore.onDocumentCreated(
  `${COLLECTIONS.MSME_BUSINESSES}/{businessId}`,
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const business = snapshot.data() as MSMEBusiness;
    
    try {
      // Update category business count
      if (business.business_category_id) {
        await FirestoreRepo.incrementField(
          COLLECTIONS.BUSINESS_CATEGORIES,
          business.business_category_id,
          'businessCount',
          1
        );
      }
      
      // Update daily counter
      const today = new Date().toISOString().split('T')[0];
      const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(`registrations_${today}`);
      
      await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        if (counterDoc.exists) {
          transaction.update(counterRef, {
            count: (counterDoc.data()?.count || 0) + 1,
            lastUpdated: Timestamp.now(),
          });
        } else {
          transaction.set(counterRef, {
            count: 1,
            date: today,
            lastUpdated: Timestamp.now(),
          });
        }
      });
      
      console.log(`Business created: ${business.id}, category count updated`);
    } catch (error) {
      console.error('Error in onMSMEBusinessCreated trigger:', error);
    }
  }
);

/**
 * When an MSME business is updated
 * - Handle verification status changes
 * - Handle category changes
 * - Sync Algolia index
 */
export const onMSMEBusinessUpdated = functions.firestore.onDocumentUpdated(
  `${COLLECTIONS.MSME_BUSINESSES}/{businessId}`,
  async (event) => {
    const beforeData = event.data?.before.data() as MSMEBusiness;
    const afterData = event.data?.after.data() as MSMEBusiness;
    
    if (!beforeData || !afterData) return;
    
    try {
      // Handle category change
      if (beforeData.business_category_id !== afterData.business_category_id) {
        // Decrement old category
        if (beforeData.business_category_id) {
          await FirestoreRepo.incrementField(
            COLLECTIONS.BUSINESS_CATEGORIES,
            beforeData.business_category_id,
            'businessCount',
            -1
          );
        }
        
        // Increment new category
        if (afterData.business_category_id) {
          await FirestoreRepo.incrementField(
            COLLECTIONS.BUSINESS_CATEGORIES,
            afterData.business_category_id,
            'businessCount',
            1
          );
          
          // Update denormalized category name
          const category = await FirestoreRepo.findById<BusinessCategory>(
            COLLECTIONS.BUSINESS_CATEGORIES,
            afterData.business_category_id
          );
          
          if (category) {
            await db.collection(COLLECTIONS.MSME_BUSINESSES)
              .doc(afterData.id!)
              .update({ category_name: category.category_name });
          }
        }
      }
      
      // Handle verification status change
      if (beforeData.is_verified !== afterData.is_verified) {
        console.log(
          `Business ${afterData.id} verification changed: ${beforeData.is_verified} -> ${afterData.is_verified}`
        );
        
        // Update status counters
        const today = new Date().toISOString().split('T')[0];
        
        // Decrement old status counter
        if (beforeData.is_verified === 1) {
          await updateStatusCounter(today, 'pending', -1);
        } else if (beforeData.is_verified === 2) {
          await updateStatusCounter(today, 'approved', -1);
        } else if (beforeData.is_verified === 3) {
          await updateStatusCounter(today, 'rejected', -1);
        }
        
        // Increment new status counter
        if (afterData.is_verified === 1) {
          await updateStatusCounter(today, 'pending', 1);
        } else if (afterData.is_verified === 2) {
          await updateStatusCounter(today, 'approved', 1);
        } else if (afterData.is_verified === 3) {
          await updateStatusCounter(today, 'rejected', 1);
        }
      }
      
      // TODO: Sync to Algolia for search if approved
      if (afterData.is_verified === 2 && beforeData.is_verified !== 2) {
        // Business just got approved - add to Algolia
        await syncToAlgolia(afterData, 'save');
      } else if (beforeData.is_verified === 2 && afterData.is_verified !== 2) {
        // Business no longer approved - remove from Algolia
        await syncToAlgolia(afterData, 'delete');
      } else if (afterData.is_verified === 2) {
        // Already approved, just update
        await syncToAlgolia(afterData, 'save');
      }
      
    } catch (error) {
      console.error('Error in onMSMEBusinessUpdated trigger:', error);
    }
  }
);

/**
 * When an MSME business is deleted (soft delete is actually an update)
 */
export const onMSMEBusinessDeleted = functions.firestore.onDocumentDeleted(
  `${COLLECTIONS.MSME_BUSINESSES}/{businessId}`,
  async (event) => {
    const deletedData = event.data?.data() as MSMEBusiness;
    
    if (!deletedData) return;
    
    try {
      // Update category count
      if (deletedData.business_category_id) {
        await FirestoreRepo.incrementField(
          COLLECTIONS.BUSINESS_CATEGORIES,
          deletedData.business_category_id,
          'businessCount',
          -1
        );
      }
      
      // Remove from Algolia
      await syncToAlgolia(deletedData, 'delete');
      
      console.log(`Business hard deleted: ${deletedData.id}`);
    } catch (error) {
      console.error('Error in onMSMEBusinessDeleted trigger:', error);
    }
  }
);

/**
 * Helper: Update status counter
 */
async function updateStatusCounter(date: string, status: string, delta: number): Promise<void> {
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(`status_${status}_${date}`);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    if (doc.exists) {
      const newCount = Math.max(0, (doc.data()?.count || 0) + delta);
      transaction.update(counterRef, { 
        count: newCount,
        lastUpdated: Timestamp.now() 
      });
    } else if (delta > 0) {
      transaction.set(counterRef, {
        count: delta,
        status,
        date,
        lastUpdated: Timestamp.now(),
      });
    }
  });
}

/**
 * Helper: Sync business to Algolia
 * TODO: Implement with Algolia SDK
 */
async function syncToAlgolia(business: MSMEBusiness, action: 'save' | 'delete'): Promise<void> {
  // Algolia integration will be added here
  // For now, just log
  console.log(`Algolia sync: ${action} business ${business.id}`);
  
  // Example implementation:
  // const algoliasearch = require('algoliasearch');
  // const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
  // const index = client.initIndex('msme_businesses');
  // 
  // if (action === 'save') {
  //   await index.saveObject({
  //     objectID: business.id,
  //     name: business.name_of_organization,
  //     category: business.category_name,
  //     region: business.region,
  //     description: business.business_description,
  //   });
  // } else {
  //   await index.deleteObject(business.id);
  // }
}
