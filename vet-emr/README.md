# Vet EMR

A modern Electronic Medical Records (EMR) system designed specifically for veterinary practices. This application helps manage patient records, track vital signs, and maintain medication lists for animal patients.

## Features

- Patient management with detailed profiles
- Vital signs tracking with interactive charts
- Medication management
- Patient history records
- Responsive design for desktop and mobile use
- Authentication system

## Technologies Used

- React
- TypeScript
- Material UI
- React Router
- Firebase/Firestore (for backend)
- Chart.js (for vital signs visualization)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd vet-emr
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment:
   Create a `.env` file in the root directory with your Firebase configuration (see `.env.example` for required fields).

## Running the Application

### Development Mode

```
npm run dev
```

The application will be available at http://localhost:3000

### Production Build

```
npm run build
npm start
```

## Project Structure

- `/src`: Source code
  - `/components`: Reusable UI components
  - `/pages`: Page components
  - `/services`: API services and Firebase integration
  - `/contexts`: React context providers (Authentication, etc.)
  - `/types`: TypeScript type definitions
  - `/utils`: Helper functions and utilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

MIT 