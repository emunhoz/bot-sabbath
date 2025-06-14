/**
 * Browser automation functionality
 */
import { chromium } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';
import type { TicketResult, TicketInfo } from './types';
import { config } from './config';

/**
 * Launch and configure a browser instance
 */
export async function launchBrowser(): Promise<Browser> {
  console.log('Launching browser...');
  return chromium.launch({
    headless: config.HEADLESS,
    args: [
      '--disable-features=site-per-process',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    firefoxUserPrefs: {
      'media.autoplay.default': 0,
      'browser.sessionstore.resume_from_crash': false
    }
  });
}

/**
 * Create a new browser context with standard settings
 */
export async function createBrowserContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    acceptDownloads: false,
    ignoreHTTPSErrors: true
  });
}

/**
 * Navigate to the event page
 */
export async function navigateToEvent(page: Page): Promise<void> {
  console.log('Navigating to the event page...');
  
  try {
    await page.goto(config.EVENT_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('Page loaded, waiting for content...');
    
    try {
      await page.waitForSelector('main, #content, .event-detail, .event-header, .tm-header', {
        timeout: 30000
      });
    } catch (waitError) {
      console.log('Warning: Timed out waiting for content selectors, but continuing anyway');
    }
    
    await page.waitForTimeout(2000);
    console.log('Navigation completed successfully');
  } catch (navError) {
    console.error('Navigation error:', navError);
    throw navError;
  }
  
  await page.waitForLoadState('networkidle');
  console.log('Waiting 5 seconds for ticket content to fully load...');
  await page.waitForTimeout(5000);
  
  try {
    await page.waitForSelector('[data-testid="quickpicksList"], .ticket-list, [data-tid="ticket-tile"], .event-tickets, .ticket-card', {
      timeout: 5000,
      state: 'attached'
    });
    console.log('Found potential ticket elements on the page');
  } catch (waitError) {
    console.log('Note: No ticket elements found in initial scan');
  }
}

/**
 * Check if CAPTCHA is present
 */
export async function checkForCaptcha(page: Page): Promise<boolean> {
  const hasCaptcha = await page.evaluate(() => {
    // Helper function to check if an element is visible and has substantial size
    function isVisible(element: Element | null): boolean {
      if (!element) return false;
      
      const htmlElement = element as HTMLElement;
      const hasSize = htmlElement.offsetWidth > 10 && htmlElement.offsetHeight > 10;
      const isNotHidden = htmlElement.offsetParent !== null || htmlElement.tagName === 'BODY';
      const notHiddenByCSS = !(htmlElement.style.visibility === 'hidden' || 
                            htmlElement.style.display === 'none' || 
                            htmlElement.style.opacity === '0');
                            
      return isNotHidden && hasSize && notHiddenByCSS;
    }
    
    // Check for visible CAPTCHA elements with more specific selectors
    const captchaElements = [
      document.querySelector('.g-recaptcha:not([style*="display: none"]):not([style*="visibility: hidden"])'),
      document.querySelector('iframe[src*="recaptcha/api2"]:not([style*="display: none"])'),
      document.querySelector('.recaptcha-checkbox[role="checkbox"]'),
      document.querySelector('.recaptcha-challenge:not(.recaptcha-challenge-expired)'),
      ...Array.from(document.querySelectorAll('div, p, h1, h2, h3, h4, h5, span'))
        .filter(el => el.textContent && el.textContent.match(/please complete the security check|confirm you're not a robot/i))
    ];
    
    return captchaElements.some(el => isVisible(el));
  });
  
  if (hasCaptcha) {
    console.log('⚠️ reCAPTCHA detected!');
    
    if (!config.HEADLESS) {
      await page.screenshot({ path: 'captcha-detected.png' });
      console.log('Screenshot saved as captcha-detected.png for verification');
      console.log('Please solve the CAPTCHA in the browser window, then wait for the script to continue...');
      
      try {
        await page.waitForFunction(
          () => {
            function isVisible(element: Element | null): boolean {
              if (!element) return false;
              const htmlElement = element as HTMLElement;
              return htmlElement.offsetParent !== null || htmlElement.tagName === 'BODY';
            }
            
            return !(
              isVisible(document.querySelector('.g-recaptcha:not([style*="display: none"])')) ||
              isVisible(document.querySelector('iframe[src*="recaptcha"]:not([style*="display: none"])')) ||
              isVisible(document.querySelector('.recaptcha-checkbox')) ||
              isVisible(document.querySelector('.recaptcha-challenge'))
            );
          },
          { timeout: 120000 } // 2 minutes timeout
        );
        console.log('CAPTCHA appears to be solved, continuing...');
      } catch (e) {
        console.log('Timed out waiting for CAPTCHA resolution, will try to proceed anyway...');
      }
    } else {
      console.log('Running in headless mode, cannot solve CAPTCHA. Consider setting HEADLESS = false');
    }
  }
  
  return hasCaptcha;
}

/**
 * Check if tickets are available
 */
export async function checkForTickets(page: Page): Promise<boolean> {
  const ticketsAvailable = await page.evaluate(() => {
    // First check if there are any ticket elements using the quickpicksList selector
    const quickPicksList = document.querySelector('[data-testid="quickpicksList"]');
    const otherTicketElements = document.querySelectorAll('.ticket-list, [data-tid="ticket-tile"], .event-tickets, .ticket-card, [data-tid="verified-resale"]');
    
    // Check if we have any tickets at all
    const hasQuickPicks = quickPicksList !== null;
    const hasOtherTickets = otherTicketElements.length > 0;
    
    console.log('Debug - Quick picks found:', hasQuickPicks);
    console.log('Debug - Other ticket elements found:', hasOtherTickets);
    
    if (hasQuickPicks || hasOtherTickets) {
      return true; // Tickets exist on page, don't rely on "no results" message
    }
    
    // Only if no ticket elements found, check for the "no results" message
    return !document.body.textContent?.includes('Sorry, we couldn\'t find any results');
  });

  if (!ticketsAvailable) {
    console.log('No tickets are available at the moment. "Sorry, we couldn\'t find any results" message found.');
    return false;
  }
  
  return true;
}

/**
 * Extract ticket information from the page
 */
export async function extractTicketInfo(page: Page): Promise<TicketInfo[]> {
  console.log('Extracting ticket information...');
  
  const hasAnyTickets = await page.evaluate(() => {
    // Check for the quickpicksList first (this contains available tickets)
    const quickPicksList = document.querySelector('[data-testid="quickpicksList"]');
    
    // Also check for text indicator of resale tickets as a backup
    const hasResaleText = document.body.textContent?.includes('Verified Resale Ticket') || false;
    
    // Return true if either condition is met
    return quickPicksList !== null || hasResaleText;
  });
  
  if (!hasAnyTickets) {
    console.log('No tickets found on the page');
    return [];
  }
  
  console.log('Tickets found on the page, extracting details...');
  
  // Extract ticket information
  const ticketInfo = await page.evaluate(() => {
    const extractedTickets: Array<any> = [];
    
    // Look for ticket elements using multiple selector strategies
    const ticketElements = Array.from(document.querySelectorAll('[data-testid="quickpicksList"] > div, .ticket-list > div, [data-tid="ticket-tile"], .event-tickets > div, .ticket-card'));
    
    console.log(`Found ${ticketElements.length} potential ticket elements`);
    
    if (ticketElements.length > 0) {
      // Try to extract information from each ticket element
      ticketElements.forEach((element) => {
        const ticketData: any = {};
        
        // Extract section information
        const sectionElement = element.querySelector('[data-testid="section-name"], [data-tid="section-name"], .section, .section-name');
        if (sectionElement) {
          ticketData.section = sectionElement.textContent?.trim();
        }
        
        // Extract price information
        const priceElement = element.querySelector('[data-testid="price"], [data-tid="price"], .ticket-price, .price');
        if (priceElement) {
          ticketData.price = priceElement.textContent?.trim();
        }
        
        // Extract row information
        const rowElement = element.querySelector('[data-testid="row-name"], [data-tid="row-name"], .row, .row-name');
        if (rowElement) {
          ticketData.row = rowElement.textContent?.trim();
        }
        
        // Extract ticket type information (e.g. Verified Resale)
        const typeElement = element.querySelector('[data-testid="verified-resale"], [data-tid="verified-resale"], .ticket-type, .type');
        if (typeElement) {
          ticketData.type = typeElement.textContent?.trim();
        }
        
        // Only add if we have at least some information
        if (Object.keys(ticketData).length > 0) {
          extractedTickets.push(ticketData);
        }
      });
    }
    
    return extractedTickets;
  });
  
  // If we couldn't extract specific ticket details but know tickets exist
  if (ticketInfo.length === 0) {
    // Add at least one generic ticket entry since we know tickets exist
    ticketInfo.push({ type: 'Available Ticket' });
  }
  
  console.log(`Successfully extracted ${ticketInfo.length} tickets`);
  return ticketInfo;
}

/**
 * Main function to check for available tickets
 */
export async function checkForResaleTickets(): Promise<TicketResult> {
  console.log('Starting ticket check process...');
  let captchaDetected = false;
  let browser: Browser | null = null;
  
  try {
    browser = await launchBrowser();
    const context = await createBrowserContext(browser);
    const page = await context.newPage();
    
    // Clear all cookies before proceeding
    await context.clearCookies();
    
    // Safely attempt to clear storage with proper error handling
    try {
      await page.evaluate(() => {
        try {
          localStorage.clear();
        } catch (e) {
          // Ignore localStorage security errors
        }
        
        try {
          sessionStorage.clear();
        } catch (e) {
          // Ignore sessionStorage security errors
        }
        
        // Safely try to clear indexedDB if available
        try {
          if (window.indexedDB && indexedDB.databases && typeof indexedDB.databases === 'function') {
            const dbs = indexedDB.databases();
            if (dbs && dbs.then) {
              dbs.then((databases) => {
                for (const db of databases) {
                  if (db.name) indexedDB.deleteDatabase(db.name);
                }
              });
            }
          }
        } catch (e) {
          // Ignore indexedDB security errors
        }
      });
    } catch (e) {
      console.log('Note: Storage clearing was restricted by browser security policy - this is normal');
    }
    
    // Navigate to the event page
    await navigateToEvent(page);
    
    // Check for CAPTCHA
    captchaDetected = await checkForCaptcha(page);
    if (captchaDetected && config.HEADLESS) {
      return { found: false, count: 0, tickets: [], captchaDetected };
    }
    
    // Check if tickets are available
    const ticketsAvailable = await checkForTickets(page);
    if (!ticketsAvailable) {
      return { found: false, count: 0, tickets: [], captchaDetected };
    }
    
    // Extract ticket information
    const tickets = await extractTicketInfo(page);
    
    return {
      found: tickets.length > 0,
      count: tickets.length,
      tickets,
      captchaDetected
    };
    
  } catch (error) {
    console.error('Error checking for tickets:', error);
    return { found: false, count: 0, tickets: [], captchaDetected };
  } finally {
    try {
      console.log('Closing browser session...');
      if (browser) {
        if (config.HEADLESS) {
          await browser.close();
        } else {
          // When in visible mode, give the user a chance to see what happened before closing
          console.log('Browser will close in 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          await browser.close();
        }
      }
    } catch (closeError) {
      console.error('Error while closing browser:', closeError);
    }
  }
}
