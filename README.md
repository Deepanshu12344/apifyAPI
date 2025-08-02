Apify Integration Web App
A full-stack web application that demonstrates integration with the Apify platform, allowing users to authenticate, browse available actors, configure inputs dynamically, and execute actor runs with real-time results.
Features
Core Requirements Met

Dynamic Schema Loading: Fetches and displays actor input schemas at runtime
Single-Run Execution: Performs exactly one actor execution per request with immediate results
Error Handling & Feedback: Clear error messages for authentication, schema loading, and execution failures
Minimal Dependencies: Clean, straightforward implementation using React, Express, and Tailwind CSS

User Experience

Intuitive Authentication: Simple API key input with validation
Actor Browse & Select: Clean list of available actors with search capability
Dynamic Form Generation: Automatically creates input forms based on actor schemas
Real-time Results: Immediate display of execution results, errors, and run statistics
Responsive Design: Modern UI that works on all screen sizes

Technical Features

Secure API Communication: Proper authentication and error handling
TypeScript-ready: Well-structured code ready for TypeScript migration
Modern React Patterns: Hooks, functional components, and clean state management
RESTful API Design: Clean separation between frontend and backend

Installation & Setup
Prerequisites

Node.js (v14 or higher)
npm or yarn
Apify API key

Backend Setup

Navigate to the backend directory and install dependencies:

bashnpm install express cors axios nodemon

Start the development server:

bashnpm run dev
The backend will run on http://localhost:3001
Frontend Setup

Create a new React app and install dependencies:

bashnpx create-react-app apify-frontend
cd apify-frontend
npm install lucide-react
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p

Configure Tailwind CSS by updating tailwind.config.js:

javascriptmodule.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

Add Tailwind directives to src/index.css:

css@tailwind base;
@tailwind components;
@tailwind utilities;

Replace the contents of src/App.js with the React component code provided.
Start the development server:

bashnpm start
The frontend will run on http://localhost:3000
Usage
Getting Started

Authentication: Enter your Apify API key to authenticate

Get your API key from Apify Console
The app validates the key by making a test API call


Actor Selection: Browse and select from your available actors

View actor names, descriptions, and usernames
Click on any actor to load its configuration


Configuration: Fill in the actor's input parameters

Form fields are generated dynamically based on the actor's schema
Supports text, numbers, booleans, and JSON arrays
Hover over field labels for descriptions


Execution: Run the actor and view results

Click "Run Actor" to execute with your configured inputs
Results appear immediately with run statistics
Error details are shown if the run fails



Actor Testing Recommendations
For testing purposes, try these publicly available actors:

Web Scraper (apify/web-scraper): General-purpose web scraping
Google Search Results (apify/google-search-scraper): Scrape Google search results
Website Content Checker (apify/website-content-checker): Monitor website changes
Email Finder (lukaskrivka/email-finder): Extract emails from websites

API Endpoints
Authentication

POST /api/auth - Validate API key
GET /api/health - Health check

Actors

GET /api/actors - List available actors
GET /api/actors/:id/schema - Get actor input schema
POST /api/actors/:id/run - Execute actor run

Project Structure
├── backend/
│   ├── server.js           # Express server with API endpoints
│   ├── package.json        # Backend dependencies
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Tailwind CSS imports
│   ├── package.json        # Frontend dependencies
│   └── public/
└── README.md
Design Decisions & Assumptions
Technical Choices

Express.js: Lightweight, perfect for API proxy layer
React with Hooks: Modern, maintainable frontend architecture
Tailwind CSS: Rapid UI development with consistent design
Axios: Robust HTTP client with better error handling than fetch

Security Considerations

API key is stored temporarily in server memory (not persistent)
CORS enabled for development (configure for production)
Input validation on both client and server sides
Error messages don't expose sensitive system information

User Experience Decisions

Progressive Disclosure: Show information step-by-step to avoid overwhelming users
Immediate Feedback: Real-time validation and loading states
Error Recovery: Clear error messages with suggested actions
Responsive Design: Works on desktop, tablet, and mobile devices

Notable Features
Dynamic Schema Handling
The app dynamically generates form fields based on each actor's unique input schema:

Text inputs for strings
Number inputs for integers/floats
Checkboxes for booleans
Textareas for arrays/objects with JSON validation

Real-time Execution

Uses Apify's waitForFinish parameter to get immediate results
Handles different run states (SUCCESS, FAILED, RUNNING)
Displays run statistics and execution timeline
Shows partial results even if data retrieval fails

Error Handling
Comprehensive error handling for:

Invalid API keys
Network connectivity issues
Actor execution failures
Malformed input data
API rate limits and quotas

Screenshots & Demo Flow
The application follows this user journey:

Landing Page: Clean authentication form with API key input
Actor Selection: Grid of available actors with descriptions
Configuration: Dynamic form based on selected actor's schema
Results: Execution results with statistics and data preview

Future Enhancements
Potential improvements for production use:

Persistent Authentication: Session management with JWT tokens
Actor Search & Filtering: Search actors by name, category, or author
Run History: Save and review previous executions
Batch Operations: Run multiple actors or configurations
Export Results: Download results in various formats (CSV, JSON, Excel)
Real-time Updates: WebSocket connection for long-running actor updates
Scheduling: Schedule actors to run at specific times
Team Collaboration: Share configurations and results with team members

Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.
Support
For issues and questions:

Check the Apify Documentation
Review common error messages in the troubleshooting section
Create an issue in this repository for bug reports or feature requests