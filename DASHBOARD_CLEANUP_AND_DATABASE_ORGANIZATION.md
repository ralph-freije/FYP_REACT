# Dashboard Cleanup + Database Organization

## Frontend
- Removed the unused `This Month` pill from `/dashboard` header.
- Kept the main `+ Log Activity` action.
- The JRPG dashboard card, account picture/name, status window, and skill rows remain unchanged.

## Backend migration cleanup
The challenge schema is now organized around two main challenge migrations:

1. `2026_07_02_100000_enhance_challenges_for_daily_ai_workflow.php`
   - Adds admin/AI challenge fields to `challenges`.

2. `2026_07_02_100100_enhance_user_challenges_for_proof_uploads.php`
   - Handles daily assignments, proof upload fields, history fields, score reward fields, streak multiplier, sharing field, timestamps, and indexes.
   - Also upgrades old `user_challenges` tables from the old composite key to a clean `id` primary key when possible.

A small compatibility migration remains:

- `2026_07_02_140000_ensure_challenge_schema_is_ready.php`

It exists only so already-running local databases are not broken if some previous migrations were already applied before this cleanup.

## Seeder cleanup
The large `DatabaseSeeder.php` was split into focused seeders:

- `DemoAccountSeeder.php`
- `MarketplaceDemoSeeder.php`
- `CommunityDemoSeeder.php`
- `ChallengeAndBadgeSeeder.php`
- `DemoActivitySeeder.php`

`DatabaseSeeder.php` now only calls the seeders in the correct order and prints the demo logins.

## Product seed image cleanup
Shared product-image helper was moved to:

- `app/Support/MarketplaceProductSeedImages.php`

This keeps product demo images and product image repair logic out of the main seeder.
