/**
 * Ticket Firestore Triggers
 * 
 * Handles side effects for help desk tickets
 */

import * as functions from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS, Ticket, TicketCategory } from '../models/schemas';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { sendHelpdeskEmail } from '../services/emailService';

const db = getFirestore();

/**
 * When a new ticket is created
 * - Send confirmation email
 * - Update category counter
 * - Notify admins
 */
export const onTicketCreated = functions.firestore.onDocumentCreated(
  `${COLLECTIONS.TICKETS}/{ticketId}`,
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const ticket = snapshot.data() as Ticket;
    
    try {
      // Update category ticket count
      if (ticket.category_id) {
        await FirestoreRepo.incrementField(
          COLLECTIONS.TICKET_CATEGORIES,
          ticket.category_id,
          'ticketCount',
          1
        );
      }
      
      // Update daily ticket counter
      const today = new Date().toISOString().split('T')[0];
      const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(`tickets_${today}`);
      
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        
        if (doc.exists) {
          transaction.update(counterRef, {
            count: (doc.data()?.count || 0) + 1,
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
      
      console.log(`Ticket created: ${ticket.ticket_id}`);
      
      // Note: Email is sent from the route handler to ensure immediate feedback
      // This trigger handles background tasks only
      
    } catch (error) {
      console.error('Error in onTicketCreated trigger:', error);
    }
  }
);

/**
 * When a ticket is updated
 * - Handle status changes
 * - Handle assignment changes
 */
export const onTicketUpdated = functions.firestore.onDocumentUpdated(
  `${COLLECTIONS.TICKETS}/{ticketId}`,
  async (event) => {
    const beforeData = event.data?.before.data() as Ticket;
    const afterData = event.data?.after.data() as Ticket;
    
    if (!beforeData || !afterData) return;
    
    try {
      // Handle status change
      if (beforeData.status !== afterData.status) {
        console.log(
          `Ticket ${afterData.ticket_id} status changed: ${beforeData.status} -> ${afterData.status}`
        );
        
        // Update status counters
        await updateTicketStatusCounter(beforeData.status, -1);
        await updateTicketStatusCounter(afterData.status, 1);
      }
      
      // Handle assignment change
      if (beforeData.assigned_to !== afterData.assigned_to && afterData.assigned_to) {
        console.log(`Ticket ${afterData.ticket_id} assigned to ${afterData.assigned_to_name}`);
        
        // Get admin email and send notification
        const adminDoc = await db.collection(COLLECTIONS.ADMINS)
          .doc(afterData.assigned_to)
          .get();
        
        if (adminDoc.exists) {
          const adminEmail = adminDoc.data()?.email;
          if (adminEmail) {
            await sendHelpdeskEmail('ticketAssigned', {
              ...afterData,
              admin_name: afterData.assigned_to_name,
              customer_name: afterData.name,
              customer_email: afterData.email,
            }, adminEmail);
          }
        }
      }
      
      // Handle resolution
      if (!beforeData.resolved_at && afterData.resolved_at) {
        console.log(`Ticket ${afterData.ticket_id} resolved`);
        
        // Calculate resolution time - validate Timestamps before calling toDate()
        let resolutionTimeHours: number | null = null;
        
        try {
          // Convert Firestore Timestamp to Date
          const convertToDate = (value: any): Date | null => {
            if (!value) return null;
            
            // Check if it has toDate method (Firestore Timestamp)
            if (typeof value.toDate === 'function') {
              return value.toDate();
            }
            
            // Check if it's a Firestore Timestamp-like object (has seconds/nanoseconds)
            if (value.seconds !== undefined && value.nanoseconds !== undefined) {
              return new Date(value.seconds * 1000 + value.nanoseconds / 1e6);
            }
            
            // Check if already a Date
            if (value instanceof Date) {
              return value;
            }
            
            // Last resort: try to parse as string/number
            try {
              const date = new Date(value);
              return isNaN(date.getTime()) ? null : date;
            } catch {
              return null;
            }
          };
          
          const createdAt = convertToDate(afterData.createdAt);
          const resolvedAt = convertToDate(afterData.resolved_at);
          
          if (createdAt && resolvedAt) {
            const timeDiff = resolvedAt.getTime() - createdAt.getTime();
            resolutionTimeHours = timeDiff > 0 ? timeDiff / (1000 * 60 * 60) : 0;
          }
        } catch (dateError) {
          console.error('Error calculating resolution time:', dateError);
          // Continue without resolution time
        }
        
        // Store for analytics
        await db.collection(COLLECTIONS.ANALYTICS).add({
          type: 'ticket_resolution',
          ticket_id: afterData.ticket_id,
          resolution_time_hours: resolutionTimeHours,
          category_id: afterData.category_id,
          priority: afterData.priority,
          resolved_at: afterData.resolved_at,
          createdAt: Timestamp.now(),
        });
      }
      
    } catch (error) {
      console.error('Error in onTicketUpdated trigger:', error);
    }
  }
);

/**
 * Helper: Update ticket status counter
 */
async function updateTicketStatusCounter(status: string, delta: number): Promise<void> {
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(`ticket_status_${status}`);
  
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    if (doc.exists) {
      const newCount = Math.max(0, (doc.data()?.count || 0) + delta);
      transaction.update(counterRef, {
        count: newCount,
        lastUpdated: Timestamp.now(),
      });
    } else if (delta > 0) {
      transaction.set(counterRef, {
        count: delta,
        status,
        lastUpdated: Timestamp.now(),
      });
    }
  });
}
