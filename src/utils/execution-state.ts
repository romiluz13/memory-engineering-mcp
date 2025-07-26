import { v4 as uuidv4 } from 'uuid';
import { getExecutionStateCollection } from '../db/connection.js';
import type { ExecutionState } from '../types/memory.js';
import { logger } from './logger.js';

/**
 * Execution state management utilities for preventing loops and tracking progress
 */

const MAX_CALL_COUNT = 3; // Maximum calls before forcing loop prevention
const CALL_TIMEOUT_MINUTES = 10; // Reset call count after this many minutes

/**
 * Check if this is a repeated call that should be prevented
 */
export async function isRepeatedCall(
  prpName: string,
  projectId: string
): Promise<{ isRepeated: boolean; callCount: number; lastCalled?: Date }> {
  try {
    const collection = getExecutionStateCollection();
    
    const existingState = await collection.findOne({
      projectId,
      prpName,
      status: { $in: ['planning', 'executing'] }
    });

    if (!existingState) {
      return { isRepeated: false, callCount: 0 };
    }

    const now = new Date();
    const timeSinceLastCall = now.getTime() - existingState.lastCalled.getTime();
    const timeoutMs = CALL_TIMEOUT_MINUTES * 60 * 1000;

    // Reset if timeout exceeded
    if (timeSinceLastCall > timeoutMs) {
      await collection.updateOne(
        { _id: existingState._id },
        { 
          $set: { 
            callCount: 1,
            lastCalled: now,
            updatedAt: now
          }
        }
      );
      return { isRepeated: false, callCount: 1 };
    }

    // Check if exceeded max calls
    const isRepeated = existingState.callCount >= MAX_CALL_COUNT;
    
    // Increment call count
    await collection.updateOne(
      { _id: existingState._id },
      { 
        $inc: { callCount: 1 },
        $set: { 
          lastCalled: now,
          updatedAt: now
        }
      }
    );

    return {
      isRepeated,
      callCount: existingState.callCount + 1,
      lastCalled: existingState.lastCalled
    };

  } catch (error) {
    logger.error('Error checking repeated call:', error);
    return { isRepeated: false, callCount: 0 };
  }
}

/**
 * Create or update execution state
 */
export async function createExecutionState(
  projectId: string,
  prpName: string,
  totalSteps: number
): Promise<string> {
  try {
    const collection = getExecutionStateCollection();
    const executionId = uuidv4();
    const now = new Date();

    const executionState: ExecutionState = {
      projectId,
      prpName,
      executionId,
      status: 'planning',
      currentStep: 0,
      totalSteps,
      completedSteps: [],
      lastCalled: now,
      callCount: 1,
      createdAt: now,
      updatedAt: now
    };

    await collection.insertOne(executionState);
    logger.info(`Created execution state for ${prpName}: ${executionId}`);
    
    return executionId;
  } catch (error) {
    logger.error('Error creating execution state:', error);
    throw error;
  }
}

/**
 * Update execution state
 */
export async function updateExecutionState(
  executionId: string,
  updates: Partial<ExecutionState>
): Promise<void> {
  try {
    const collection = getExecutionStateCollection();
    
    await collection.updateOne(
      { executionId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    logger.info(`Updated execution state ${executionId}:`, updates);
  } catch (error) {
    logger.error('Error updating execution state:', error);
    throw error;
  }
}

/**
 * Get execution state by ID
 */
export async function getExecutionState(executionId: string): Promise<ExecutionState | null> {
  try {
    const collection = getExecutionStateCollection();
    return await collection.findOne({ executionId });
  } catch (error) {
    logger.error('Error getting execution state:', error);
    return null;
  }
}

/**
 * Mark execution as complete
 */
export async function markExecutionComplete(
  executionId: string,
  completedSteps: string[]
): Promise<void> {
  await updateExecutionState(executionId, {
    status: 'complete',
    currentStep: completedSteps.length,
    completedSteps
  });
}

/**
 * Clean up old execution states (older than 24 hours)
 */
export async function cleanupOldExecutionStates(): Promise<void> {
  try {
    const collection = getExecutionStateCollection();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await collection.deleteMany({
      createdAt: { $lt: oneDayAgo },
      status: { $in: ['complete', 'failed'] }
    });

    if (result.deletedCount > 0) {
      logger.info(`Cleaned up ${result.deletedCount} old execution states`);
    }
  } catch (error) {
    logger.error('Error cleaning up execution states:', error);
  }
}