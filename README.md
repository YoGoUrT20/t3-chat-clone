# T3 Chat Clone - Quiver 🏹

> Demo hosted at [chat.minefloat.com](https://chat.minefloat.com)
## Features

- Resumable Streams
- Temporary Chats
- Customization
- Set own Api keys
- Chat sharing
- Branches support
- Mobile support
- Syntax highlighting / customizable
- MarkDown / tables support 
## Getting Started

This project requires configuration of environment variables for both development and production. Please follow the appropriate setup instructions below.

---

## Development Setup

1. **Clone the repository:**
   `git clone https://github.com/YoGoUrT20/t3-chat-clone.git`

2. **Install dependencies:**
   `npm install`

3. **Configure environment variables:**
   - Create a `.env` file in the project root with your Firebase and app config:
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
   - Create a `.env` file in the `functions/` directory with the following variables:
     ```
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
     HOST=http://localhost:3000
     API_KEY_SECRET=our_32_byte_secret_key_here_123456
     OPENROUTER_REFERER=your_openrouter_referer
     OPENROUTER_TITLE=your_openrouter_title
     OPEN_ROUTER_API_KEY=your_openrouter_api_key
     REACT_APP_FIREBASE_API_KEY=your_api_key
     REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
     REACT_APP_FIREBASE_PROJECT_ID=your_project_id
     REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     REACT_APP_FIREBASE_APP_ID=your_app_id
     REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
     REACT_APP_FUNCTIONS_URL=https://<server-region>-<project-id>.cloudfunctions.net
     ```
     The Firebase variables must match those in your root `.env` file.

4. **Set up Firebase:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Create a new project or select your existing project.
   - Enable Firestore Database:
     - In the left menu, select &apos;Firestore Database&apos; and click &apos;Create database&apos;.
     - Choose a security mode and location, then complete the setup.
   - Enable Authentication:
     - In the left menu, select &apos;Authentication&apos; and click &apos;Get started&apos;.
     - Enable the sign-in methods you want to support (such as Email/Password, Google, etc).
   - These steps are required for both development and production environments.

5. **Start the development server:**
   `npm run dev`

6. **Open** http://localhost:3000 in your browser.

---

## Production Setup

To set up for production, first complete the Development Setup steps above. Then:

1. **Build the project for production:**
   `npm run build`

2. **Ensure both `.env` and `functions/.env` are configured with production values.**
   - Use your production Firebase and Stripe credentials.
   - Update `HOST` in `functions/.env` to your production domain.

3. **Deploy your app and functions according to your hosting provider&apos;s instructions.**

---

## Environment Variables Reference

### Root `.env`
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`
- `REACT_APP_FUNCTIONS_URL`

### `functions/.env`
- `STRIPE_SECRET_KEY` (Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` (Stripe webhook secret)
- `HOST` (Frontend host URL)
- `API_KEY_SECRET` (Secret for encrypting API keys)
- `OPENROUTER_REFERER` (OpenRouter referer)
- `OPENROUTER_TITLE` (OpenRouter title)
- `OPEN_ROUTER_API_KEY` (OpenRouter API key)
- All Firebase variables as above (must match root `.env`)

You can find your Firebase values in your Firebase project settings. Stripe and OpenRouter values are available in their respective dashboards.

---

## Folder Structure

- `src/` - Main source code
  - `components/` - UI components (SidePanel, MainContent, AuthPage, etc.)
  - `firebase.js` - Firebase initialization
  - `AuthContext.js` - Authentication context/provider
  - `App.js` - Main app entry
- `public/` - Static assets

## License

See LICENSE file for details.
