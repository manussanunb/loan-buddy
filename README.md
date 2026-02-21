# LoanBuddy

A private loan tracking app for two people. Track loans, repayments, and amortization schedules between an admin and a friend.

## Stack

- **Framework** — Next.js 16 (App Router)
- **Database** — Supabase (Postgres)
- **Styling** — Tailwind CSS + shadcn/ui
- **Hosting** — Vercel

## Features

- PIN-based login (admin + friend, no accounts)
- Create, edit, and delete loan records
- Amortization schedule with reducing balance method
- Repayment tracking — any amount, excess reduces principal
- Schedule recalculates automatically on every repayment change
- Standalone loan calculator (fixed term or fixed monthly payment)
- Dark theme, mobile-friendly
