# Nexus API Documentation

## Authentication
All admin routes require a `Bearer <token>` in the `Authorization` header.

## Screens
* **GET** `/api/screens`: List all screens (Includes `qrCode` as Base64 data URI).
* **GET** `/api/screens/:id`: Get screen details (Includes `qrCode`).
* **GET** `/api/screens/me`: Get current screen identity.
* **GET** `/api/screens/manifest`: Get the full evaluated manifest for a screen.
* **PUT** `/api/screens/:id`: Update screen configuration/status.

## Configuration
* **GET** `/api/config`: Fetch all global application settings.
* **POST** `/api/config`: Update or create a configuration key.

## Media
* **POST** `/api/media/upload`: Upload new media (Multipart).
* **GET** `/api/media`: List all media assets.
* **PUT** `/api/media/:id/status`: Approve or reject media.

## Templates & Frames
* **POST** `/api/templates`: Create a new layout with frames.
* **GET** `/api/templates`: List all templates.
* **PUT** `/api/templates/:id`: Update a template and its frames (Absolute Coordinates).

## Schedules
* **POST** `/api/schedule`: Create a new schedule (Links media/template to screen).
* **GET** `/api/schedule/active`: Get currently active schedules.

## Tickers
* **GET** `/api/tickers`: List all ticker configs.
* **POST** `/api/tickers`: Create a new dynamic ticker.

## Logs
* **GET** `/api/logs/audit`: View admin action history.
* **GET** `/api/logs/errors`: View system error logs.
