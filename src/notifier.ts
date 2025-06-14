/**
 * Notification functionality for ticket alerts
 */
import { exec } from 'child_process';
import { config } from './config';
import type { TicketInfo } from './types';

/**
 * Send a web notification via ntfy.sh
 */
export async function sendWebNotification(ticketCount: number): Promise<void> {
  try {
    console.log(`Sending notification for ${ticketCount} tickets found`);
    
    const response = await fetch(config.NOTIFY_URL, {
      method: 'POST',
      body: `Found ${ticketCount} tickets!`,
      headers: {
        'Title': 'Ticket Alert',
        'Priority': 'urgent',
        'Tags': 'warning,skull',
        'Actions': 'view, Open Ticketmaster, ' + config.EVENT_URL
      }
    });
    
    if (!response.ok) {
      console.error('Failed to send notification:', response.statusText);
    } else {
      console.log('Web notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending web notification:', error);
  }
}

/**
 * Open the ticketmaster page in the default browser
 */
export function openTicketPage(): void {
  try {
    exec(`open "${config.EVENT_URL}"`, (error) => {
      if (error) {
        console.error('Error opening browser:', error);
      } else {
        console.log('Opened browser to event page');
      }
    });
  } catch (openError) {
    console.error('Error attempting to open browser:', openError);
  }
}

/**
 * Format ticket details for display
 */
export function formatTicketDetails(tickets: TicketInfo[]): string {
  return tickets
    .map(ticket => {
      const details = [];
      if (ticket.section) details.push(ticket.section);
      if (ticket.row) details.push(`Row ${ticket.row}`);
      if (ticket.price) details.push(ticket.price);
      return details.join(', ');
    })
    .join('\n');
}

/**
 * Notify user about available tickets using all notification methods
 */
export async function notifyTicketsFound(ticketCount: number, tickets: TicketInfo[]): Promise<void> {
  const ticketDetails = formatTicketDetails(tickets);
  const message = `Found ${ticketCount} resale ticket(s) available!\n${ticketDetails}`;
  
  console.log(message);
  
  // Send web notification
  await sendWebNotification(ticketCount);
  
  // Open the browser
  openTicketPage();
}
