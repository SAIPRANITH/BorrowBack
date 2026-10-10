# BorrowBack

BorrowBack is a campus sharing application for listing items, arranging
borrowing, managing returns and fines, and requesting short-term loans. The
repository contains a React web client, an Express/MongoDB API, and an Expo
mobile client.

## Projects

| Path | Purpose |
| --- | --- |
| `client/` | Browser app built with React and Vite. |
| `server/` | Express API, authentication, MongoDB models, and AWS integrations. |
| `mobile/` | Expo / React Native client for Android, iOS, and web. |
| `borrowback.conf` | Nginx site configuration for serving the built web client and proxying API requests. |
| `deploy/borrowback-certbot-renew.service` | Renews and installs the server's short-lived HTTPS certificate. |
| `deploy/borrowback-certbot-renew.timer` | Runs the certificate renewal check every six hours. |

## Web client

| File | What it does |
| --- | --- |
| `client/index.html` | HTML document Vite uses to bootstrap the browser app. |
| `client/vite.config.js` | Configures Vite, React, Tailwind CSS, and the local API proxy. |
| `client/src/main.jsx` | Mounts the React application and its top-level providers. |
| `client/src/App.jsx` | Declares application routes and role-based page access. |
| `client/src/index.css` | Defines the application's global styles, themes, and shared UI classes. |
| `client/src/api/api.js` | Creates the Axios client and attaches the signed-in user's token to requests. |
| `client/src/context/AuthContext.jsx` | Shares authentication state and handles login, profile updates, and inactivity logout. |
| `client/src/components/ItemCard.jsx` | Displays a browsable item card with image, owner, and pricing details. |
| `client/src/components/Layout.jsx` | Provides the shared authenticated page layout. |
| `client/src/components/Navbar.jsx` | Renders the main navigation and account actions. |
| `client/src/components/PaymentModal.jsx` | Confirms that an external payment has already been made; it does not process payments. |
| `client/src/components/ProtectedRoute.jsx` | Redirects signed-out visitors away from protected pages. |
| `client/src/components/StarRating.jsx` | Shows an item's or user's star rating. |
| `client/src/pages/AdminDashboard.jsx` | Gives administrators access to user, listing, and system management. |
| `client/src/pages/BorrowRequests.jsx` | Lets item owners review and manage incoming borrowing requests. |
| `client/src/pages/BrowseItems.jsx` | Searches, filters, and displays available listings. |
| `client/src/pages/Dashboard.jsx` | Shows the signed-in user's dashboard and activity summary. |
| `client/src/pages/Fines.jsx` | Displays borrowing and peer-loan financial summaries. |
| `client/src/pages/ItemDetail.jsx` | Shows a listing's details and borrowing actions. |
| `client/src/pages/LoginPage.jsx` | Provides the account sign-in form. |
| `client/src/pages/MoneyLoanRequest.jsx` | Submits a request for a short-term loan. |
| `client/src/pages/MoneyLoans.jsx` | Lists and manages money-loan requests. |
| `client/src/pages/MyBorrows.jsx` | Displays the user's borrowed items and their return status. |
| `client/src/pages/MyItems.jsx` | Creates and manages the user's listings, including image uploads and image URLs. |
| `client/src/pages/Notifications.jsx` | Displays and manages account notifications. |
| `client/src/pages/Profile.jsx` | Updates the signed-in user's profile details. |
| `client/src/pages/RegisterPage.jsx` | Creates a new user account. |
| `client/src/pages/update_styles.cjs` | Applies local style updates to the page sources. |
| `client/public/images/` | Static photographs used for the web app's backgrounds and example item imagery. |

## API server

| File | What it does |
| --- | --- |
| `server/server.js` | Configures Express middleware, connects the API routes, and starts the server. |
| `server/config/aws.js` | Creates AWS service clients when credentials are configured. |
| `server/config/db.js` | Connects the API to MongoDB. |
| `server/controllers/admin.controller.js` | Implements administrator operations and reporting. |
| `server/controllers/auth.controller.js` | Registers users, authenticates logins, and serves profile operations. |
| `server/controllers/borrow.controller.js` | Handles borrowing requests, approvals, returns, and related records. |
| `server/controllers/item.controller.js` | Creates, reads, updates, and removes item listings. |
| `server/controllers/moneyloan.controller.js` | Handles money-loan requests and their lifecycle. |
| `server/controllers/notification.controller.js` | Reads and updates user notifications. |
| `server/middleware/auth.js` | Verifies bearer tokens and attaches the authenticated user to a request. |
| `server/middleware/errorHandler.js` | Formats API errors into consistent JSON responses. |
| `server/middleware/metricsMiddleware.js` | Collects request metrics for the monitoring service. |
| `server/middleware/upload.js` | Validates image uploads and stores them using the configured S3 integration. |
| `server/models/Borrow.js` | Defines the borrowing-request database schema. |
| `server/models/Item.js` | Defines the item-listing database schema. |
| `server/models/MoneyLoan.js` | Defines the money-loan database schema. |
| `server/models/Notification.js` | Defines the notification database schema. |
| `server/models/User.js` | Defines user data and password-hashing behavior. |
| `server/routes/admin.routes.js` | Maps administrator API endpoints to their controllers. |
| `server/routes/auth.routes.js` | Maps registration, login, and profile endpoints. |
| `server/routes/borrow.routes.js` | Maps borrowing and return endpoints. |
| `server/routes/item.routes.js` | Maps listing endpoints and their upload middleware. |
| `server/routes/moneyloan.routes.js` | Maps money-loan endpoints. |
| `server/routes/notification.routes.js` | Maps notification endpoints. |
| `server/services/emailService.js` | Sends email through the configured AWS email service. |
| `server/services/metricsService.js` | Publishes application metrics to AWS CloudWatch. |
| `server/utils/fineCalculator.js` | Calculates late-return fines from borrow dates and item rates. |

## Mobile client

| File | What it does |
| --- | --- |
| `mobile/App.js` | Sets up the mobile app's shared providers and navigation entry point. |
| `mobile/app.json` | Defines the Expo app name, platform settings, and bundled assets. |
| `mobile/babel.config.js` | Configures Babel for the Expo project. |
| `mobile/src/api/api.js` | Configures authenticated requests from the mobile app to the API. |
| `mobile/src/context/AuthContext.js` | Manages mobile sign-in, registration, session state, and inactivity logout. |
| `mobile/src/navigation/AppNavigator.js` | Declares the app's navigation stacks and tabs. |
| `mobile/src/theme/index.js` | Shares colors, typography, and other visual tokens across mobile screens. |
| `mobile/src/components/Badge.js` | Renders compact status and category labels. |
| `mobile/src/components/Button.js` | Provides the shared mobile button styles and behavior. |
| `mobile/src/components/Card.js` | Provides a reusable mobile content card. |
| `mobile/src/components/EmptyState.js` | Shows guidance when a screen has no content. |
| `mobile/src/components/index.js` | Re-exports the shared mobile components. |
| `mobile/src/components/Input.js` | Provides a styled, reusable form input. |
| `mobile/src/components/LoadingScreen.js` | Displays the shared loading state. |
| `mobile/src/screens/AddItemScreen.js` | Creates a new item listing from the mobile app. |
| `mobile/src/screens/AdminScreen.js` | Shows administrator overview, service health, alerts, recent loans, and account summaries. |
| `mobile/src/screens/BorrowsScreen.js` | Displays borrowing requests and their status. |
| `mobile/src/screens/BrowseScreen.js` | Browses available item listings. |
| `mobile/src/screens/DashboardScreen.js` | Shows the mobile dashboard and account activity. |
| `mobile/src/screens/FinesScreen.js` | Displays recorded deposits and fine summaries. |
| `mobile/src/screens/ItemDetailScreen.js` | Shows a listing's details and borrowing options. |
| `mobile/src/screens/LoginScreen.js` | Signs a user into the mobile app. |
| `mobile/src/screens/MoneyLoanRequestScreen.js` | Submits a mobile money-loan request. |
| `mobile/src/screens/MoneyLoansScreen.js` | Displays and manages money-loan requests. |
| `mobile/src/screens/MyItemsScreen.js` | Displays and manages the user's mobile listings. |
| `mobile/src/screens/NotificationsScreen.js` | Displays mobile account notifications. |
| `mobile/src/screens/PlaceholderScreen.js` | Shows the shared placeholder for screens awaiting implementation. |
| `mobile/src/screens/ProfileScreen.js` | Displays and updates the mobile user profile. |
| `mobile/src/screens/RegisterScreen.js` | Creates an account from the mobile app. |

## Setup

Use Node.js 20 or later for the API, and install the web and server
dependencies from their respective directories:

```powershell
cd server
npm ci
npm run dev
```

In a second terminal:

```powershell
cd client
npm ci
npm run dev
```

The API reads its database, token, and optional AWS configuration from
environment variables. Keep actual credentials in a local `server/.env` file
or the deployment platform's secret store; never commit them. The mobile app
can be started with `npm install` and `npx expo start` from `mobile/`.
The production web server redirects HTTP to HTTPS, serves the ACME renewal
challenge over HTTP, and renews its short-lived IP certificate automatically.

## Android APK

The Android client can be built as a standalone APK without Expo Go. Install
Java 17 and the Android SDK (platform 36, build tools 36.0.0, NDK 27.1.12297006,
and CMake 3.22.1), then run this from PowerShell:

```powershell
cd mobile
npm ci
.\build-apk.ps1
```

The script creates a release signing key and DPAPI-protected password in
`%LOCALAPPDATA%\BorrowBack\android-signing`. Back up this directory securely
under the same Windows account because future APK updates must use the same
signing key. The finished APK is copied to
`client/public/downloads/BorrowBack.apk`, where the web login page links to it.
The Android app connects to the HTTPS API URL configured by
`EXPO_PUBLIC_API_URL` (defaulting to the production endpoint).

Peer loans, deposits, and fines are tracking records only. BorrowBack does not
currently transfer money or connect to a payment provider; users must settle
payments using an agreed method outside the app and only then record them.
For peer loans and security deposits, the paying user reports the payment and
the lender must confirm receipt. When an item with a confirmed deposit is
returned, the lender records that the deposit was sent back and the borrower
acknowledges receipt to complete the deposit return.

## Local utility scripts

These one-off scripts are present in some local working copies but are not
included in this repository. Their descriptions are recorded here so it is
clear what they are for; review them before adding or running them. In
particular, database seeding and repair scripts can modify stored data, and
some local scripts refer to machine-specific paths.

| File | What it does |
| --- | --- |
| `client/fix_inputs.py` | Adjusts input-related markup in local web page files. |
| `client/remove_hovers.py` | Removes hover styling from local web page files. |
| `fix_web.py` | Fixes known JSX text issues and removes selected hover styles from local web source files. |
| `strip_css_hovers.py` | Removes selected hover styles from the web app stylesheet. |
| `generate_qr.py` | Creates an Expo QR code for a fixed local network address and writes it to a machine-specific folder. |
| `patch_money.py` | Patches response-data handling in the separate `BorrowBackMobile` loan screen. |
| `seedFinal.js` | Seeds MongoDB with the final demo dataset. |
| `seedFixed.js` | Seeds MongoDB with corrected demo records. |
| `seedFull.js` | Seeds MongoDB with an expanded set of demo records. |
| `seedProd.js` | Seeds MongoDB with demo records for a production-like environment. |
| `server/checkData.cjs` | Inspects local database records. |
| `server/checkImages.js` | Checks image URLs on stored item listings. |
| `server/checkUsers.cjs` | Inspects local user records. |
| `server/expandMyItemsAndRequests.js` | Adds sample item listings and borrowing requests to MongoDB. |
| `server/fixImages.js` | Repairs image URLs on stored item listings. |
| `server/seedDemoData.js` | Seeds MongoDB with demo users and application data. |
| `server/seedFixes.js` | Applies corrections to MongoDB demo data. |
| `server/seedImages.js` | Seeds image URLs for demo listings. |
| `server/seedMasterData.cjs` | Seeds reference and demo data in MongoDB. |
| `server/seedPayments.js` | Adds demo payment records to MongoDB. |
| `server/seedRichItems.js` | Adds detailed sample item listings to MongoDB. |
| `server/testPassword.js` | Checks password matching against a MongoDB user record. |
| `server/updateImages.js` | Updates image URLs on stored item listings. |

## Generated and private files

Dependency folders, build output, local environment files, and Expo-generated
files are excluded from Git. Keep real database, token, and AWS credentials in
local environment files or the deployment platform's secret store; never
commit them.
