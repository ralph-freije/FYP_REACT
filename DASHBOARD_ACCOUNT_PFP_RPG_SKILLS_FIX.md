# Dashboard account profile + RPG skills fix

Updated `/dashboard` EcoTrack Status card:

- The avatar block now uses the logged-in account profile picture.
- The fallback avatar uses the user's initials when no profile picture exists.
- The `PLAYER` label was replaced with the logged-in account name.
- The main status title now uses the account name: `Level X User Name`.
- Transport, Diet, Energy, and Shopping are redesigned as RPG-style skill rows.
- Each skill row includes an icon, class label, progress meter, and carbon value.
- The design stays inside the existing green EcoTrack theme.

Validated with `npm run build` successfully.
