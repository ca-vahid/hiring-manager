import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc, where, QueryConstraint, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import { Candidate, CategoryScores, CategoryWeights, FilterOptions, DocumentInfo, SortOption } from './types';
import { debug } from './debug';
import { auth } from '@/lib/firebase/firebase';

// Constants
const CANDIDATES_COLLECTION = 'candidates';

// Default weights for scoring categories
export const DEFAULT_WEIGHTS: CategoryWeights = {
  technicalSkills: 0.4,
  communicationSkills: 0.25,
  experience: 0.25,
  culturalFit: 0.1
};

// Calculate overall score based on category scores and weights
export function calculateOverallScore(scores: CategoryScores, weights: CategoryWeights): number {
  let weightedScore = 0;
  let totalWeight = 0;
  
  // Calculate weighted score by multiplying each score by its weight
  for (const category in scores) {
    if (weights[category]) {
      weightedScore += scores[category] * weights[category];
      totalWeight += weights[category];
    }
  }
  
  // If no valid weights, return 0
  if (totalWeight === 0) return 0;
  
  // Return normalized score (0-10 scale)
  return parseFloat((weightedScore / totalWeight).toFixed(1));
}

// Function to recursively remove undefined values from an object
function removeDeeplyUndefined(obj: any): any {
  if (obj === undefined) {
    return null; // Convert undefined to null for Firestore
  }
  
  if (obj === null) {
    return null;
  }
  
  if (typeof obj !== 'object' || obj instanceof Date || obj instanceof Timestamp) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    const result = obj
      .map(item => removeDeeplyUndefined(item))
      .filter(item => item !== undefined);
    return result.length > 0 ? result : [];
  }
  
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = removeDeeplyUndefined(obj[key]);
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}

// Get all candidates, with optional filtering and sorting
export async function getCandidates(filterOptions?: FilterOptions, sortOption?: SortOption): Promise<Candidate[]> {
  console.log("Current auth state:", auth.currentUser);
  try {
    const candidatesRef = collection(db, CANDIDATES_COLLECTION);
    const constraints: QueryConstraint[] = [];
    
    // Add filters if provided
    if (filterOptions?.status && filterOptions.status !== 'All') {
      constraints.push(where('status', '==', filterOptions.status));
    }
    
    // To avoid index errors, limit the complexity of queries
    // Add sorting if provided and it doesn't require a complex index
    if (sortOption) {
      // Simple fields that shouldn't require custom indexes
      const simpleSortFields = ['name', 'email', 'createdAt', 'updatedAt'];
      
      if (simpleSortFields.includes(sortOption.field)) {
        constraints.push(orderBy(sortOption.field, sortOption.direction));
      } else {
        // For complex fields, we'll sort client-side to avoid requiring indexes
        debug.warning(`Skipping server-side sort on ${sortOption.field} to avoid index requirements`);
      }
    } else {
      // Default sort by updatedAt if no sort option provided
      constraints.push(orderBy('updatedAt', 'desc'));
    }
    
    // Create and execute query
    const q = constraints.length > 0 
      ? query(candidatesRef, ...constraints)
      : query(candidatesRef);
    
    const querySnapshot = await getDocs(q);
    
    // Convert to Candidate objects
    let candidates = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      } as Candidate;
    });
    
    // If we need to apply client-side filtering for keyword search
    if (filterOptions?.searchTerm) {
      const keyword = filterOptions.searchTerm.toLowerCase();
      candidates = candidates.filter(candidate => {
        const searchableFields = [
          candidate.name,
          candidate.email,
          candidate.phone,
          candidate.linkedin,
          candidate.github,
          ...(candidate.documents?.notes || []).map(note => note.name),
        ].filter(Boolean);
        
        return searchableFields.some(field => 
          field?.toLowerCase().includes(keyword)
        );
      });
    }
    
    // If we need to filter by score
    if (filterOptions?.minScore !== undefined) {
      candidates = candidates.filter(c => c.overallScore >= filterOptions.minScore!);
    }
    
    if (filterOptions?.maxScore !== undefined) {
      candidates = candidates.filter(c => c.overallScore <= filterOptions.maxScore!);
    }
    
    // If we need to sort client-side because the sort field would require a custom index
    if (sortOption && !['name', 'email', 'createdAt', 'updatedAt'].includes(sortOption.field)) {
      candidates.sort((a, b) => {
        // Get the values to compare
        let fieldA: any = a;
        let fieldB: any = b;
        
        // Handle nested fields like 'scores.technicalSkills'
        const fieldParts = sortOption.field.split('.');
        for (const part of fieldParts) {
          if (fieldA && typeof fieldA === 'object') {
            fieldA = fieldA[part];
          }
          if (fieldB && typeof fieldB === 'object') {
            fieldB = fieldB[part];
          }
        }
        
        // Safety check for undefined/null values
        if (fieldA === undefined || fieldA === null) fieldA = sortOption.direction === 'asc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        if (fieldB === undefined || fieldB === null) fieldB = sortOption.direction === 'asc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
        
        // Compare based on direction
        if (sortOption.direction === 'asc') {
          return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
        } else {
          return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
        }
      });
    }
    
    return candidates;
  } catch (error) {
    console.error("Test query failed with error:", error);
    debug.error('Error getting candidates:', error);
    throw error;
  }
}

// Get a single candidate by ID
export async function getCandidate(id: string): Promise<Candidate | null> {
  try {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, id);
    const candidateSnap = await getDoc(candidateRef);
    
    if (candidateSnap.exists()) {
      const data = candidateSnap.data();
      return {
        id: candidateSnap.id,
        ...data,
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      } as Candidate;
    } else {
      return null;
    }
  } catch (error) {
    debug.error('Error getting candidate:', error);
    throw error;
  }
}

// Create a new candidate
export async function createCandidate(candidateData: Partial<Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Candidate> {
  try {
    // First, remove any deeply nested undefined values
    const safeCandidate = removeDeeplyUndefined(candidateData);
    
    // Ensure default values for required fields
    const candidateWithDefaults = {
      name: safeCandidate.name || '',
      email: safeCandidate.email || '',
      starRating: safeCandidate.starRating || 0,
      status: safeCandidate.status || 'Active',
      scores: safeCandidate.scores || {
        technicalSkills: 0,
        communicationSkills: 0,
        experience: 0,
        culturalFit: 0
      },
      overallScore: safeCandidate.overallScore || 0,
      documents: safeCandidate.documents || {
        resume: null,
        coverLetter: null,
        notes: [],
        transcripts: []
      },
      ...safeCandidate
    };
    
    // Add timestamps
    const newCandidateData = {
      ...candidateWithDefaults,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add to Firebase
    const candidatesRef = collection(db, CANDIDATES_COLLECTION);
    const newCandidateRef = doc(candidatesRef);
    await setDoc(newCandidateRef, newCandidateData);
    
    // Return the new candidate with ID
    return {
      ...newCandidateData,
      id: newCandidateRef.id
    } as Candidate;
  } catch (error) {
    debug.error('Error creating candidate:', error);
    throw error;
  }
}

// Update an existing candidate
export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate> {
  try {
    // First, remove any deeply nested undefined values
    const safeUpdates = removeDeeplyUndefined(updates);
    
    const candidateRef = doc(db, CANDIDATES_COLLECTION, id);
    
    // Add updated timestamp
    const updateData = {
      ...safeUpdates,
      updatedAt: Date.now()
    };
    
    await updateDoc(candidateRef, updateData);
    
    // Get the updated candidate
    const updatedCandidate = await getCandidate(id);
    if (!updatedCandidate) {
      throw new Error(`Failed to retrieve updated candidate with ID ${id}`);
    }
    
    return updatedCandidate;
  } catch (error) {
    debug.error('Error updating candidate:', error);
    throw error;
  }
}

// Delete a candidate
export async function deleteCandidate(id: string): Promise<void> {
  try {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, id);
    await deleteDoc(candidateRef);
  } catch (error) {
    debug.error('Error deleting candidate:', error);
    throw error;
  }
}

// Upload a document for a candidate
export async function uploadCandidateDocument(
  candidateId: string,
  file: File,
  documentType: 'resume' | 'coverLetter' | 'notes' | 'transcripts'
): Promise<DocumentInfo> {
  try {
    // Create a reference to the file in Firebase Storage
    const fileExtension = file.name.split('.').pop();
    const fileName = `${candidateId}_${documentType}_${Date.now()}.${fileExtension}`;
    const filePath = `candidates/${candidateId}/${documentType}/${fileName}`;
    const fileRef = ref(storage, filePath);
    
    // Upload the file
    await uploadBytes(fileRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    
    // Create document info
    const documentInfo: DocumentInfo = {
      id: fileName,
      name: file.name,
      url: downloadURL,
      type: file.type,
      uploadedAt: Date.now()
    };
    
    // Update the candidate's document info in Firestore
    const candidateRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    const candidateSnap = await getDoc(candidateRef);
    
    if (!candidateSnap.exists()) {
      throw new Error(`Candidate with ID ${candidateId} not found`);
    }
    
    const candidateData = candidateSnap.data();
    const documents = candidateData.documents || {};
    
    // Different handling based on document type
    if (documentType === 'resume' || documentType === 'coverLetter') {
      // For resume and cover letter, we replace the existing document
      documents[documentType] = documentInfo;
    } else {
      // For notes and transcripts, we add to the array
      if (!documents[documentType]) {
        documents[documentType] = [];
      }
      documents[documentType].push(documentInfo);
    }
    
    // Update the candidate
    await updateDoc(candidateRef, { documents });
    
    return documentInfo;
  } catch (error) {
    debug.error('Error uploading candidate document:', error);
    throw error;
  }
}

// Delete a document for a candidate
export async function deleteCandidateDocument(
  candidateId: string,
  documentType: 'resume' | 'coverLetter' | 'notes' | 'transcripts',
  documentId?: string
): Promise<void> {
  try {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    const candidateSnap = await getDoc(candidateRef);
    
    if (!candidateSnap.exists()) {
      throw new Error(`Candidate with ID ${candidateId} not found`);
    }
    
    const candidateData = candidateSnap.data();
    const documents = candidateData.documents || {};
    
    // Different handling based on document type
    if (documentType === 'resume' || documentType === 'coverLetter') {
      // If there's a document, delete it from storage
      if (documents[documentType]) {
        const fileName = documents[documentType].id;
        const filePath = `candidates/${candidateId}/${documentType}/${fileName}`;
        const fileRef = ref(storage, filePath);
        
        try {
          await deleteObject(fileRef);
        } catch (error) {
          debug.error('Error deleting document from storage:', error);
          // Continue even if storage delete fails
        }
        
        // Update the candidate
        documents[documentType] = null;
        await updateDoc(candidateRef, { documents });
      }
    } else if (documentId) {
      // For notes and transcripts, we remove the specific document
      if (documents[documentType] && Array.isArray(documents[documentType])) {
        const docIndex = documents[documentType].findIndex((doc: DocumentInfo) => doc.id === documentId);
        
        if (docIndex >= 0) {
          // Delete from storage
          const fileName = documents[documentType][docIndex].id;
          const filePath = `candidates/${candidateId}/${documentType}/${fileName}`;
          const fileRef = ref(storage, filePath);
          
          try {
            await deleteObject(fileRef);
          } catch (error) {
            debug.error('Error deleting document from storage:', error);
            // Continue even if storage delete fails
          }
          
          // Remove from array
          documents[documentType].splice(docIndex, 1);
          await updateDoc(candidateRef, { documents });
        }
      }
    }
  } catch (error) {
    debug.error('Error deleting candidate document:', error);
    throw error;
  }
} 