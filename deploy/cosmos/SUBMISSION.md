# Cosmos package

This directory contains the official-marketplace candidate for **LX Family**.
It uses Cosmos' route and network integration with Cosmos authentication as
the first gate. LX Family's own profile login remains active for
family-specific permissions inside the app.

## Submission checklist

1. Copy `LXFamily/` into
   `azukaar/Cosmos-Servapps-official/servapps/LXFamily/`.
2. Copy the reviewed `icon.png` and the product screenshots into
   `servapps/LXFamily/screenshots/`. The icon URL already uses Cosmos'
   marketplace-local GitHub Pages path.
3. Validate the rendered Cosmos installer on a disposable server before
   submitting the PR. Confirm that the generated `APP_SECRET` remains intact
   after a normal platform update and that both named volumes remain attached.
4. Keep the description, architecture list and GitHub release version in sync.
   Cosmos uses `:latest` so installed containers can receive later releases;
   fixed version tags cannot be bumped by Cosmos (maintainer feedback in #312).
   Leave `cosmos-auto-update=false` to keep updates administrator-controlled.

Existing installations must change their image to `:latest` once and update
the image, retaining both named volumes and their generated `APP_SECRET`.
See `docs/STORE_SUBMISSIONS.md` for the Android proxy-login flow.

After Cosmos authentication, the first launch opens LX Family onboarding. It
creates the first family only; additional families require the administrator's
explicit registration setting.
