/**
 * FirestoreRepository - Base repository for Firestore operations
 * 
 * Replaces the Sequelize-based BaseRepository.js with Firestore equivalents.
 * Maintains similar API patterns for easier migration.
 */

import { getFirestore, Timestamp, FieldValue, Query, DocumentData } from 'firebase-admin/firestore';
import { BaseDocument, COLLECTIONS } from '../models/schemas';

const db = getFirestore();

// =============================================================================
// TYPES
// =============================================================================

export interface ListParams {
  searchParams?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface ListResult<T> {
  rows: T[];
  count: number;
  totalPages: number;
  currentPage: number;
}

export interface WhereClause {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCurrentTimestamp(): Timestamp {
  return Timestamp.now();
}

/**
 * Convert Firestore Timestamps to ISO strings for JSON serialization
 */
function convertTimestamps<T>(data: any): T {
  if (data === null || data === undefined) return data;
  
  // If it's a Firestore Timestamp
  if (data instanceof Timestamp || (data && data._seconds !== undefined && data._nanoseconds !== undefined)) {
    // Handle both Timestamp instances and serialized timestamp objects
    if (data instanceof Timestamp) {
      return data.toDate().toISOString() as any;
    }
    // Handle already-serialized timestamp object { _seconds, _nanoseconds }
    return new Date(data._seconds * 1000).toISOString() as any;
  }
  
  // If it's an array, convert each element
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamps(item)) as any;
  }
  
  // If it's an object, convert each property
  if (typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  return data;
}

function buildQuery(
  collection: FirebaseFirestore.CollectionReference,
  params: ListParams
): Query<DocumentData> {
  let query: Query<DocumentData> = collection;
  
  // Note: We can't filter by deletedAt == null in Firestore because
  // documents without the field won't match. Instead, we'll filter
  // in the application layer for missing deletedAt or null values.
  // Only filter if explicitly wanting deleted items
  // Removed: query = query.where('deletedAt', '==', null);
  
  // Apply search params
  if (params.searchParams) {
    for (const [key, value] of Object.entries(params.searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        // Handle array values (IN queries)
        if (Array.isArray(value)) {
          query = query.where(key, 'in', value);
        } else {
          query = query.where(key, '==', value);
        }
      }
    }
  }
  
  // Ordering
  if (params.orderBy) {
    query = query.orderBy(params.orderBy, params.orderDirection || 'desc');
  } else {
    query = query.orderBy('createdAt', 'desc');
  }
  
  return query;
}

// =============================================================================
// REPOSITORY FUNCTIONS
// =============================================================================

/**
 * Create a new document
 */
export async function create<T = any>(
  collectionName: string,
  data: Record<string, any>
): Promise<T> {
  const now = getCurrentTimestamp();
  const docRef = db.collection(collectionName).doc();
  
  const documentData = {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  
  await docRef.set(documentData);
  return documentData as T;
}

/**
 * Create a document with a specific ID
 */
export async function createWithId<T = any>(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<T> {
  const now = getCurrentTimestamp();
  const docRef = db.collection(collectionName).doc(id);
  
  const documentData = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  
  await docRef.set(documentData);
  return documentData as T;
}

/**
 * Bulk create documents
 */
export async function bulkCreate<T = any>(
  collectionName: string,
  items: Record<string, any>[]
): Promise<T[]> {
  const batch = db.batch();
  const now = getCurrentTimestamp();
  const results: T[] = [];
  
  for (const item of items) {
    const docRef = db.collection(collectionName).doc();
    const documentData = {
      ...item,
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    batch.set(docRef, documentData);
    results.push(documentData as T);
  }
  
  await batch.commit();
  return results;
}

/**
 * Find document by ID
 */
export async function findById<T = any>(
  collectionName: string,
  id: string,
  includeDeleted = false
): Promise<T | null> {
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return null;
  
  const data = doc.data() as any;
  // Treat any truthy deletedAt as deleted (handles null, undefined, and Timestamp)
  if (!includeDeleted && data.deletedAt) return null;
  
  return convertTimestamps(data) as T;
}

/**
 * Find one document by field value
 */
export async function findOne<T = any>(
  collectionName: string,
  field: string,
  value: any,
  includeDeleted = false
): Promise<T | null> {
  const query = db.collection(collectionName).where(field, '==', value);
  
  const snapshot = await query.limit(10).get(); // Get a few to filter
  
  if (snapshot.empty) return null;
  
  // Filter out deleted documents
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (includeDeleted || data.deletedAt === null || data.deletedAt === undefined) {
      return convertTimestamps(data) as T;
    }
  }
  
  return null;
}

/**
 * Find all documents by field value
 */
export async function findAll<T = any>(
  collectionName: string,
  field: string,
  value: any,
  includeDeleted = false
): Promise<T[]> {
  const query = db.collection(collectionName).where(field, '==', value);
  
  const snapshot = await query.get();
  
  // Filter out deleted documents
  return snapshot.docs
    .filter(doc => {
      if (includeDeleted) return true;
      const data = doc.data();
      return data.deletedAt === null || data.deletedAt === undefined;
    })
    .map(doc => convertTimestamps(doc.data()) as T);
}

/**
 * List documents with pagination
 */
export async function list<T = any>(
  collectionName: string,
  params: ListParams = {}
): Promise<ListResult<T>> {
  const collection = db.collection(collectionName);
  const limit = params.limit || 10;
  const offset = params.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const includeDeleted = params.includeDeleted || false;
  
  // Build query for data
  let dataQuery = buildQuery(collection, params);
  
  // Get all documents (we'll filter and paginate in memory)
  // This is needed because Firestore can't filter on missing fields
  const snapshot = await dataQuery.get();
  
  // Filter out soft-deleted documents if not including deleted
  let allDocs = snapshot.docs;
  if (!includeDeleted) {
    allDocs = allDocs.filter(doc => {
      const data = doc.data();
      return data.deletedAt === null || data.deletedAt === undefined;
    });
  }
  
  const totalCount = allDocs.length;
  
  // Apply pagination in memory
  const paginatedDocs = allDocs.slice(offset, offset + limit);
  
  return {
    rows: paginatedDocs.map(doc => convertTimestamps(doc.data()) as T),
    count: totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage,
  };
}

/**
 * Update a document
 */
export async function update<T = any>(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<T | null> {
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return null;
  
  const updateData = {
    ...data,
    updatedAt: getCurrentTimestamp(),
  };
  
  await docRef.update(updateData);
  
  const updated = await docRef.get();
  return convertTimestamps(updated.data()) as T;
}

/**
 * Soft delete a document
 */
export async function softDelete<T extends BaseDocument>(
  collectionName: string,
  id: string
): Promise<boolean> {
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return false;
  
  await docRef.update({
    deletedAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  });
  
  return true;
}

/**
 * Restore a soft-deleted document
 */
export async function restore<T extends BaseDocument>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return null;
  
  await docRef.update({
    deletedAt: null,
    updatedAt: getCurrentTimestamp(),
  });
  
  const restored = await docRef.get();
  return convertTimestamps(restored.data()) as T;
}

/**
 * Hard delete a document (permanent)
 */
export async function hardDelete(
  collectionName: string,
  id: string
): Promise<boolean> {
  const docRef = db.collection(collectionName).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return false;
  
  await docRef.delete();
  return true;
}

/**
 * Count documents
 * Note: Excludes soft-deleted documents by default
 */
export async function count(
  collectionName: string,
  params: ListParams = {}
): Promise<number> {
  const collection = db.collection(collectionName);
  let query = buildQuery(collection, params);
  
  // Add soft-delete filter unless includeDeleted is true
  if (!params.includeDeleted) {
    query = query.where('deletedAt', '==', null);
  }
  
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/**
 * Count documents with specific field value
 */
export async function countByField(
  collectionName: string,
  field: string,
  value: any,
  includeDeleted = false
): Promise<number> {
  let query = db.collection(collectionName).where(field, '==', value);
  
  if (!includeDeleted) {
    query = query.where('deletedAt', '==', null);
  }
  
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

/**
 * Increment a counter field
 */
export async function incrementField(
  collectionName: string,
  id: string,
  field: string,
  incrementBy = 1
): Promise<void> {
  const docRef = db.collection(collectionName).doc(id);
  await docRef.update({
    [field]: FieldValue.increment(incrementBy),
    updatedAt: getCurrentTimestamp(),
  });
}

/**
 * Run a transaction
 */
export async function runTransaction<T>(
  callback: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return db.runTransaction(callback);
}

/**
 * Get a batch writer for bulk operations
 */
export function getBatch(): FirebaseFirestore.WriteBatch {
  return db.batch();
}

/**
 * Get collection reference
 */
export function getCollection(collectionName: string): FirebaseFirestore.CollectionReference {
  return db.collection(collectionName);
}

/**
 * Get document reference
 */
export function getDocRef(collectionName: string, id: string): FirebaseFirestore.DocumentReference {
  return db.collection(collectionName).doc(id);
}

// =============================================================================
// SUBCOLLECTION HELPERS
// =============================================================================

/**
 * Create document in subcollection
 */
export async function createInSubcollection<T extends BaseDocument>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<T> {
  const now = getCurrentTimestamp();
  const docRef = db
    .collection(parentCollection)
    .doc(parentId)
    .collection(subcollection)
    .doc();
  
  const documentData = {
    ...data,
    id: docRef.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  
  await docRef.set(documentData);
  return documentData as T;
}

/**
 * List documents from subcollection
 */
export async function listFromSubcollection<T extends BaseDocument>(
  parentCollection: string,
  parentId: string,
  subcollection: string,
  includeDeleted = false
): Promise<T[]> {
  const query = db
    .collection(parentCollection)
    .doc(parentId)
    .collection(subcollection);
  
  // Fetch all docs and filter in memory to handle missing deletedAt field
  const snapshot = await query.get();
  
  return snapshot.docs
    .filter(doc => {
      if (includeDeleted) return true;
      const data = doc.data();
      return data.deletedAt === null || data.deletedAt === undefined;
    })
    .map(doc => convertTimestamps(doc.data()) as T);
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export const FirestoreRepo = {
  create,
  createWithId,
  bulkCreate,
  findById,
  findOne,
  findAll,
  list,
  update,
  softDelete,
  restore,
  hardDelete,
  count,
  countByField,
  incrementField,
  runTransaction,
  getBatch,
  getCollection,
  getDocRef,
  createInSubcollection,
  listFromSubcollection,
};

export default FirestoreRepo;
