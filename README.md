# Veterinary Anesthesia Management

A web application for monitoring vital signs during veterinary anesthesia procedures.

## Features

- Patient management system
- Real-time vital sign charting
- Medication tracking
- Patient history records
- Authentication system

## Tech Stack

- React with TypeScript
- Vite for fast development
- Firebase for backend (Authentication, Firestore)
- Material-UI for UI components
- Chart.js for data visualization
- React Router for navigation

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

This will start the development server at http://localhost:5173

### Building for Production

```bash
npm run build
```

## Development Mode

The application is configured with development mode enabled, which provides the following:

- Persistent authenticated user (no need to log in)
- Mock data for patients, vital signs, medications, and patient history
- No actual Firebase writes during development

To enable real Firebase operations, set `DEVELOPMENT_MODE = false` in the `auth.ts` and `patients.ts` files.

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
  - `/pages` - Page components
  - `/services` - API services
  - `/contexts` - React contexts
  - `/types` - TypeScript type definitions
  - `/hooks` - Custom React hooks
  - `/utils` - Utility functions

## License

MIT
