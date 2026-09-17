# Veterinary Store Management App

A professional, 100% offline, local-first Android application built with React Native and Expo. This app is designed for veterinary clinics and pet medicine stores to seamlessly manage their products, track inventory by batches, process sales using strict FIFO logic, and monitor their store's performance.

## 🚀 Key Features

- **100% Offline Local Database**: Powered by Expo SQLite. No backend, no API, no cloud database required. Total privacy and reliability.
- **Advanced Sales Engine (FIFO)**: Automatically deducts stock from the oldest available batches (First-In, First-Out) to minimize expired inventory.
- **Accurate Profit Margins**: Calculates profit based on the exact purchase cost of the individual batch units sold.
- **Smart Alerts**: Get instantly notified about out-of-stock items, low stock warnings, and batches expiring in the next 30 days.
- **Reporting**: View interactive daily and monthly sales/profit summaries, as well as a product leaderboard.
- **Data Portability**: Easily backup your entire database (`.db` file) to external storage, Google Drive, or Email, and restore it on any device.

## 🛠️ Technology Stack

- **React Native** & **Expo** (Expo Router for navigation)
- **TypeScript** for robust type safety
- **SQLite** (`expo-sqlite`) for local relational data storage
- **NativeWind** (Tailwind CSS) for clean, modern styling
- **Lucide React Native** for beautiful vector iconography
- **Expo File System & Sharing** for offline database backup and restore

## 📦 Local Development Setup

To run this project on your Windows machine, ensure you have Node.js and Git installed.

1. **Clone the repository & navigate into it**
   ```bash
   git clone https://github.com/saad163/vet-app.git
   cd vet-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Expo Development Server**
   ```bash
   npx expo start
   ```

4. **Test the App**
   - **On a physical device:** Install the **Expo Go** app from the Google Play Store, open it, and scan the QR code displayed in your terminal.
   - **On an emulator:** Set up an Android Virtual Device in Android Studio, ensure it is running, and press `a` in the terminal to launch the app.

## 📱 Generating the Android APK

This project is configured to be built using **EAS (Expo Application Services)**.

To compile a standalone Android APK that works independently of Expo Go:
```bash
npx eas-cli build -p android --profile preview
```

If you prefer to build the APK completely locally using your own hardware (requires Android Studio / Android SDK to be installed), run:
```bash
npx eas-cli build -p android --profile preview --local
```

## 📁 Architecture Overview

- `/app` - Expo Router screens (Dashboard, Products, Sales, Alerts, Reports, etc.)
- `/src/db` - The core SQLite database layer. Contains the initialization script and isolated logic for executing purchases, deduplicating sales via FIFO transactions, and querying reports.
- `/src/types` - Global TypeScript interfaces for the database schemas.

## 📄 Product Requirements
For an in-depth look at the feature specifications, please read the [Product Requirements Document (PRD.md)](./PRD.md).
