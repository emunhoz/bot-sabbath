/**
 * Logging functionality for ticket checking
 */
import * as fs from 'fs';
import type { LogEntry } from './types';
import { config } from './config';

/**
 * Log scraping run information to CSV file
 */
export function logScrapingRun(logEntry: LogEntry): void {
  try {
    // Check if file exists to determine if we need to add headers
    const fileExists = fs.existsSync(config.LOG_FILE_PATH);
    
    // Process error message for CSV - simplified version
    let processedErrorMsg = '';
    if (logEntry.errorMessage) {
      // Start with a clean slate
      let simplifiedError = '';
      
      // Handle timeout errors (most common in the logs)
      if (logEntry.errorMessage.includes('TimeoutError')) {
        simplifiedError = 'Browser timeout';
      }
      // Handle connection errors
      else if (logEntry.errorMessage.includes('Connection terminated') || 
              logEntry.errorMessage.includes('pipe_handler')) {
        simplifiedError = 'Connection error';
      }
      // Handle navigation errors
      else if (logEntry.errorMessage.includes('Navigation failed')) {
        simplifiedError = 'Navigation failed';
      }
      // Handle browser crash
      else if (logEntry.errorMessage.includes('process did exit')) {
        simplifiedError = 'Browser crashed';
      }
      // Handle network errors
      else if (logEntry.errorMessage.includes('net::ERR') || 
              logEntry.errorMessage.includes('network error')) {
        simplifiedError = 'Network error';
      }
      // Handle CAPTCHA errors
      else if (logEntry.errorMessage.includes('captcha') || 
              logEntry.errorMessage.includes('CAPTCHA')) {
        simplifiedError = 'CAPTCHA detected';
      }
      // Handle page errors
      else if (logEntry.errorMessage.includes('page.goto')) {
        simplifiedError = 'Page navigation error';
      }
      // Handle other errors - extract just the core type
      else {
        // Try to find the error name
        const errorTypes = ['Error', 'Exception', 'TypeError', 'SyntaxError', 'ReferenceError'];
        for (const errorType of errorTypes) {
          if (logEntry.errorMessage.includes(errorType)) {
            simplifiedError = errorType;
            break;
          }
        }
        
        // If nothing specific found, use generic error
        if (!simplifiedError) {
          simplifiedError = 'Script error';
        }
      }
      
      processedErrorMsg = simplifiedError;
    }
    
    // Create CSV line
    const csvLine = `${logEntry.timestamp},${logEntry.success},${logEntry.ticketsFound},${processedErrorMsg},${logEntry.runDuration},${logEntry.captchaDetected}\n`;
    
    // If file doesn't exist, create it with headers
    if (!fileExists) {
      const headers = 'timestamp,success,ticketsFound,errorMessage,runDuration,captchaDetected\n';
      fs.writeFileSync(config.LOG_FILE_PATH, headers);
    }
    
    // Append log entry
    fs.appendFileSync(config.LOG_FILE_PATH, csvLine);
    console.log(`Scraping information logged to ${config.LOG_FILE_PATH}`);
  } catch (error) {
    console.error('Error logging scraping information:', error);
  }
}

/**
 * Format a timestamp with European timezone format (with offset)
 */
export function formatTimestamp(): string {
  // Format the timestamp with European timezone format (with offset)
  const now = new Date();
  const timeOptions: Intl.DateTimeFormatOptions = { 
    timeZone: 'Europe/Paris',
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  };
  
  // Format: YYYY-MM-DDThh:mm:ss+02:00 (European format)
  const dateParts = new Intl.DateTimeFormat('en-GB', timeOptions).formatToParts(now);
  const year = dateParts.find(part => part.type === 'year')?.value;
  const month = dateParts.find(part => part.type === 'month')?.value;
  const day = dateParts.find(part => part.type === 'day')?.value;
  const hour = dateParts.find(part => part.type === 'hour')?.value;
  const minute = dateParts.find(part => part.type === 'minute')?.value;
  const second = dateParts.find(part => part.type === 'second')?.value;
  
  // Get timezone offset
  const offset = now.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, '0');
  const offsetMinutes = Math.abs(offset % 60).toString().padStart(2, '0');
  const offsetSign = offset <= 0 ? '+' : '-'; // Note: getTimezoneOffset() returns negative for positive UTC offsets
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetSign}${offsetHours}:${offsetMinutes}`;
}
