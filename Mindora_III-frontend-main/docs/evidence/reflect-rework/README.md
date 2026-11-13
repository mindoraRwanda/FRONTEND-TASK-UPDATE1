# Reflect rework - Phase B (UI removals)

Captured with Playwright against a production build, with all API responses mocked (no backend, no real alerts).

- Removed the "Messages" nav item from the patient sidebar (the `/messages` route is kept, just not linked from navigation).
- Removed the red "Emergency: 112" buttons (sidebar crisis card and mobile top bar). The "Call +250 783 974 066" button and card are kept.
- Added "If you are in danger, call 112" (`tel:112`, 44px tall) to the Reflect chat failure banner.

## Patient sidebar, 1366x768

![Patient sidebar at 1366x768](sidebar-1366x768.png)

## Mobile drawer, 375px

![Mobile drawer at 375px](drawer-375.png)

## Chat failure banner, 375px

![Chat failure banner at 375px](chat-failure-banner-375.png)
