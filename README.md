# Ticketmaster Alert

A TypeScript-based tool to monitor Ticketmaster for resale ticket availability. Uses Playwright to bypass Ticketmaster's anti-scraping protections and provides desktop notifications when tickets become available.

## Features

- Monitors Ticketmaster event pages for verified resale tickets
- Uses Playwright for robust browser automation
- Sends push notifications when tickets are found
- Automatically opens the event page in your browser when tickets are found
- Retries on failure with exponential backoff
- Configurable checking intervals
- Modular architecture for maintainability and scalability

## Project Structure

The application follows a modular architecture for better maintainability:

```
ticketmaster-alert/
├── src/
│   ├── config.ts        - Configuration settings
│   ├── types.ts         - TypeScript interfaces
│   ├── browser.ts       - Browser automation functionality
│   ├── logger.ts        - Logging functionality
│   ├── notifier.ts      - Notification functionality
│   └── index.ts         - Application entry point
├── package.json
└── ticketmaster_scraping_log.csv
```

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

3. Start the ticket monitoring tool:
   ```bash
   bun start
   ```

## Configuration

You can modify the following variables in `src/config.ts` to configure the tool:

- `EVENT_URL`: The URL of the Ticketmaster event to monitor
- `NOTIFY_URL`: The URL of the notification service to use (default: ntfy.sh)
- `INTERVAL_MINUTES`: How often to check for tickets (default: 10 minutes)
- `MAX_RETRIES`: Number of retry attempts if checking fails
- `HEADLESS`: Set to false for visible browser (useful for debugging)

## Requirements

- Node.js v20.10.4 or higher
- Bun v1.1.56 or higher
- Playwright v1.40.0 or higher
- ntfy.sh url

