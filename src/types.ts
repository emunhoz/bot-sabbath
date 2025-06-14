/**
 * Type definitions for the application
 */

export interface TicketInfo {
  section?: string;
  price?: string;
  row?: string;
  type?: string;
}

export interface TicketResult {
  found: boolean;
  count: number;
  tickets: TicketInfo[];
  captchaDetected: boolean;
}

export interface LogEntry {
  timestamp: string;
  success: boolean;
  ticketsFound: number;
  errorMessage?: string;
  runDuration: number; // in milliseconds
  captchaDetected: boolean;
}
