# FunkWeb Meeting Room Booking System

A full-stack, local-network meeting room reservation portal built for internal office use. This application prevents double-booking through atomic database transactions and is hosted exclusively on the local subnet (`0.0.0.0`) for maximum internal security and isolation from the public internet.

## 🚀 Tech Stack

*   **Framework:** Next.js 15.5 (App Router)
*   **UI Library:** React 19
*   **Language:** TypeScript
*   **Database:** SQLite (Local `dev.db`)
*   **ORM:** Prisma 6.19
*   **Styling:** CSS Variables & System Fonts

## ✨ Key Features

*   **Atomic Double-Booking Prevention:** Utilizes `prisma.$transaction` to combine conflict-checking (`findFirst`) and database insertion (`create`) into a single, isolated database transaction. This ensures strict protection against race conditions under concurrent load.
*   **Local Network Isolation:** Configured to bind to `0.0.0.0`, keeping the application strictly on the local office Wi-Fi subnet (e.g., `192.168.x.x`) to eliminate public internet exposure.
*   **Resilient Error Handling:** Includes defensive checks for SQLite's single-writer connection queue limits (P2024 timeouts), returning `503 Service Unavailable` to safely prompt client retries under heavy load.
*   **Strict Input Validation:** Server-side validation parsing ensures proper data sanitization, date chronology checks (start time < end time), and strict type safety before any database interaction.

## 🛠️ Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20 LTS or higher recommended)
*   npm, yarn, pnpm, or bun

### 1. Installation
Clone the repository and install the required dependencies:
```bash
npm install