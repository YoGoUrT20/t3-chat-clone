# T3 Chat Clone - Quiver 🏹

## Features

- TODO


## Getting Started

1. Clone the repository:
   `git clone https://github.com/YoGoUrT20/t3-chat-clone.git`

2. Install dependencies:
   `npm install`

3. Set up your environment variables and firebase (see below).

4. Start the development server:
   
   `npm run dev`

5. Open http://localhost:3000 in your browser.

## Environment Variables

Create a `.env` file in the project root with your Firebase config:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_FUNCTIONS_URL=https://<server-region>-<project-id>.cloudfunctions.net

```

You can find these values in your Firebase project settings. The app will not work without these variables set.

## Folder Structure

- `src/` - Main source code
  - `components/` - UI components (SidePanel, MainContent, AuthPage, etc.)
  - `firebase.js` - Firebase initialization
  - `AuthContext.js` - Authentication context/provider
  - `App.js` - Main app entry
- `public/` - Static assets

## License

See LICENSE file for details.
