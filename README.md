# Gift Pool

A simple gift-pool tracker for organisers who need to manage equal contributions, partial payments, overpayments, and final settlements.

## Features

- Create a gift pool with a target budget
- Add and remove participants
- Automatically calculate each person's equal share
- Record multiple payments per participant
- Show paid, owed, or receivable balances
- Track total collected and remaining amount
- Generate a simple settlement plan showing who should pay whom
- Responsive dashboard UI

## Tech Stack

- React + Vite
- Node.js + Express
- SQLite (`better-sqlite3`)
- Plain CSS

## Prerequisites

- Node.js 18+
- npm

## Setup

From the project root:

```bash
npm install
npm run install:all
```

## Run

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:4000`.

## Production build

```bash
npm run build
```

## API

- `POST /api/pools` — create a pool
- `GET /api/pools/:id` — get pool dashboard data
- `POST /api/pools/:id/members` — add a participant
- `DELETE /api/members/:id` — remove a participant
- `POST /api/members/:id/payments` — record a payment
- `GET /api/pools/:id/settlements` — generate settlement plan

## Business Rules

Fair share is:

`pool budget / number of participants`

Participant balance is:

`total paid - fair share`

- Negative balance: participant still owes money.
- Positive balance: participant should receive money.
- Zero: participant has reached their fair share.

The settlement generator greedily matches debtors with creditors until the balances are cleared.

## Debugging

If the app does not start:

1. Confirm Node.js 18+ is installed.
2. Run `npm install`.
3. Run `npm run install:all`.
4. Check that ports 5173 and 4000 are available.
5. Delete `server/data/gift_pool.db` only if you want to reset all local data.
6. Check the browser console and server terminal for errors.

## Notes

This is intentionally an MVP. Authentication, real payment processing, email notifications, and multi-currency support are outside the core assignment scope.
