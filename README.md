# Ticketmaster Alert

A TypeScript-based tool to monitor Ticketmaster for resale ticket availability. Uses Playwright to bypass Ticketmaster's anti-scraping protections and provides notifications (via ntfy) when tickets become available.

> 🤘 **METAL MISSION ACCOMPLISHED**: This bot successfully helped me score tickets to Black Sabbath's "Back to the Beginning" reunion show when they were sold out everywhere!

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

## Docker Setup

You can also run this application in a Docker container, which provides isolation and handles all dependencies automatically.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system

### Steps to Run with Docker

1. Build the Docker image:
   ```bash
   docker build -t bot-sabbath .
   ```

2. Run the container:
   ```bash
   docker run -p 3333:3333 bot-sabbath
   ```

3. To stop the container:
   ```bash
   # Find the container ID
   docker ps
   
   # Stop the container
   docker stop <container-id>
   ```

### Docker Compose (Alternative)

Alternatively, you can use Docker Compose for a simpler workflow:

1. Create a `docker-compose.yml` file with:
   ```yaml
   version: '3'
   services:
     bot-sabbath:
       build: .
       ports:
         - "3333:3333"
   ```

2. Start with Docker Compose:
   ```bash
   docker-compose up
   ```

3. Stop with Docker Compose:
   ```bash
   docker-compose down
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
- ntfy.sh url and app (to receive notifications)

## Success Story

When Black Sabbath announced their "Back to the Beginning" reunion tour, tickets sold out in minutes. Instead of manually logging in or giving up, I created this automated sentinel to watch Ticketmaster day and night.

After running quietly in the background for weeks, the bot's notification finally came through at the perfect moment - someone had just listed their tickets at face value! Thanks to instant notifications and automatic browser opening, I was able to grab them before anyone else.

*"Never Say Die" - Black Sabbath*
