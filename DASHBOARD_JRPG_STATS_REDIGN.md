# Dashboard JRPG Stats Redesign

Updated `/dashboard` to reduce white space and replace the old Carbon Footprint and Level Progress cards.

## Frontend changes

- Updated `src/pages/Dashboard.jsx`
- Updated `src/pages/Dashboard.css`

## What changed

- Removed the large `Carbon Footprint / Monthly overview of CO2 emission` card from the top of the dashboard.
- Removed the separate `Level Progress` card.
- Added one large JRPG-style status card that fits the EcoTrack green theme.
- The new card includes:
  - Current level
  - EcoScore
  - XP progress to the next level
  - Today CO₂
  - This week CO₂
  - Month CO₂
  - All time CO₂
  - Completed goals
  - Completed quests/challenges
  - Category stats for transport, diet, energy, and shopping
  - Quick buttons for logging activity and opening daily challenges
- Reorganized the right column to keep only compact useful cards:
  - Daily challenges
  - Mini leaderboard
- Added responsive CSS for desktop, tablet, and mobile.

## Validation

- React production build passed with Vite.
- `node_modules` and `dist` were removed before zipping.
