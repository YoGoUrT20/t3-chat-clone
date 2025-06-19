# T3 Chat Clone - Quiver 🏹

> Demo hosted at [chat.minefloat.com](https://chat.minefloat.com)

This project was created as part of the [T3 Chat Cloneathon](https://cloneathon.t3.chat/) - an open source competition to build the best T3 Chat clone. The competition ran until June 18, 2025.

### Competition Overview
- **Challenge**: Build a cool AI chat app with support for multiple LLMs, authentication, and chat synchronization
- **Requirements**: Web-based, open source, and easily testable
- **Bonus Features**: 
  - Attachment Support
  - Image Generation
  - Syntax Highlighting
  - Resumable Streams
  - Chat Branching
  - Chat Sharing
  - Web Search
  - Bring Your Own Key
  - Mobile Support
  - And more creative features!

## Quiver Features

- Resumable Streams
- Temporary Chats
- Customization
- Set own Api keys
- Chat sharing
- Branches support
- Mobile support
- Syntax highlighting / customizable
- Markdown / tables support 
- Stripe/payments support
- Programmable shortcuts
- History extraction
- Web search
- Temporary chats
- Multiple tabs Synchronization
- Search shortcut
- Installable app (install button from chrome)
- & more
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
     API_KEY_SECRET=our_32_byte_secret_key_here_123
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
   - When you will start using message history, you will get an error, to fix it:
     - Open developer tools (F12).
     - Click on the link to create firestore index.
   - Login into firebase within the project using Firebase CLI.
     - `firebase login`
     - `firebase use:email@gmail.com`
   - Deploy the functions
   - `firebase deploy --only functions`

5. **Start the development server:**
   `