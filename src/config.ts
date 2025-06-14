/**
 * Application configuration
 */
import * as path from 'path';

export const config = {
  // Event settings
  EVENT_URL: 'https://www.ticketmaster.co.uk/back-to-the-beginning-birmingham-05-07-2025/event/360062289EF011A5',
  NOTIFY_URL: 'https://ntfy.sh/ticket-alert',
  
  // Check frequency
  INTERVAL_MINUTES: 10,
  MAX_RETRIES: 3,
  
  // Browser settings
  HEADLESS: true,
  
  // Logging
  LOG_FILE_PATH: path.join(process.cwd(), 'ticketmaster_scraping_log.csv'),
};
