# Tracking Module

Tracking events are exposed via:

- `GET /api/deliveries/:id/track` — returns the full timeline for a delivery

The endpoint is implemented in `modules/deliveries/deliveries.controller.js`
(`track` handler) because it operates on the `deliveries` resource.

A standalone `tracking` module will be introduced when we add live
location streaming (Socket.io) and per-courier position updates.