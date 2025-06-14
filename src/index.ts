/**
 * Ticketmaster Ticket Alert Application
 * 
 * Checks for available tickets on Ticketmaster and sends notifications
 * when tickets become available.
 */
import { checkForResaleTickets } from './browser';
import { logScrapingRun, formatTimestamp } from './logger';
import { notifyTicketsFound } from './notifier';
import { config } from './config';
import type { LogEntry } from './types';

/**
 * Main function to check for tickets and notify if found
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let ticketsFound = 0;
  let errorMessage = '';
  let captchaDetected = false;
  
  try {
    const result = await checkForResaleTickets();
    captchaDetected = result.captchaDetected;
    
    if (result.found && result.count > 0) {
      await notifyTicketsFound(result.count, result.tickets);
      ticketsFound = result.count;
    }
    
    success = true;
    // Don't log anything when no tickets are found (as per requirements)
  } catch (error) {
    console.error('Error in main function:', error);
    
    // Extract the detailed error message with proper stack trace
    if (error instanceof Error) {
      errorMessage = error.stack || `${error.name}: ${error.message}`;
    } else {
      errorMessage = String(error);
    }
    
    success = false;
  } finally {
    // Log the scraping run information
    const endTime = Date.now();
    const runDuration = endTime - startTime;
    
    const logEntry: LogEntry = {
      timestamp: formatTimestamp(),
      success,
      ticketsFound,
      errorMessage,
      runDuration,
      captchaDetected
    };
    
    logScrapingRun(logEntry);
  }
}

/**
 * Run with retry capability on failure
 */
async function runWithRetry(): Promise<void> {
  let retries = 0;
  let success = false;
  
  while (retries < config.MAX_RETRIES && !success) {
    try {
      await main();
      success = true;
    } catch (error) {
      retries++;
      console.error(`Attempt ${retries}/${config.MAX_RETRIES} failed:`, error);
      if (retries < config.MAX_RETRIES) {
        const delay = retries * 5000; // Increasing backoff
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

// Initial run
runWithRetry();

// Set up automatic checking at regular intervals
const INTERVAL_MS = config.INTERVAL_MINUTES * 60 * 1000;
console.log(`Script will check for tickets every ${config.INTERVAL_MINUTES} minutes`);
setInterval(runWithRetry, INTERVAL_MS);

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\nTicket checking stopped by user');
  process.exit(0);
});
