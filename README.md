# New Malik Veterinary

## Project Overview
**New Malik Veterinary** is a complete, offline-first Point of Sale (POS) and Inventory Management mobile application designed specifically for a veterinary store. It enables store owners to easily manage their daily operations, track stock, process sales and returns, and generate analytical reports entirely on their local device without requiring an internet connection.

All business data is securely stored locally on the device, ensuring maximum privacy, speed, and offline reliability.

## Technologies Used
- **React Native & Expo:** The core framework used to build the cross-platform mobile application, providing a smooth, native-like experience.
- **TypeScript:** Used for robust, type-safe code that prevents runtime errors and improves maintainability.
- **SQLite (`expo-sqlite`):** The local database engine used to persistently store all products, sales, and customer data directly on the device.
- **Zustand:** Used for lightweight and fast global state management.
- **NativeWind (Tailwind CSS):** Used for styling the application with a clean, modern, and professional veterinary-themed UI.
- **Expo Print:** Used to generate printable PDF reports of sales and inventory data.
- **Lucide React Native:** Used for clean and beautiful vector icons throughout the interface.

## Main Features
- **Products:** Complete product catalog management with categories, brands, min/max selling prices, and minimum stock alerts.
- **Purchases:** Record inbound inventory purchases from suppliers. Stock is automatically incremented and the product's purchase price and expiry date are updated.
- **Stock Tracking:** Real-time stock calculation managed natively on the product level.
- **Sales:** Process customer sales. The app validates stock levels and pricing limits, calculates profit instantly, and deducts stock from inventory.
- **Returns:** Full support for processing customer returns. Stock is added back to inventory, and profit margins are automatically reversed.
- **Customers:** Maintain a database of customers for tracking sale history.
- **Alerts:** A smart dashboard that proactively notifies you of Out of Stock items, Low Stock items, and Expiring/Expired products.
- **Reports:** Detailed financial and inventory reports covering sales, purchases, profit margins, and stock valuation.
- **PDF Generation:** Export any report to a beautifully formatted PDF document for printing or sharing.
- **Import / Export (Backup / Restore):** Complete data safety tools allowing you to export your entire local database to a `.sqlite` file and restore it on any device.

## Database
- **SQLite:** The application uses a strictly local SQLite database file named `vetstore.db`.
- **Local Storage:** No data is sent to the cloud. Everything lives on the physical device.
- **No Batch System:** The database utilizes a streamlined, product-centric schema. Stock quantities, master purchase prices, and expiry dates are stored directly on the `products` table, ensuring high performance and data integrity.
- **Main Tables:** `products`, `purchases`, `purchase_items`, `sales`, `sale_items`, `returns`, `return_items`, `customers`.

---

## How To Run Locally

To run the project on your development machine, ensure you have Node.js installed, then run:

```bash
# Install all dependencies
npm install

# Start the Expo development server (clearing cache)
npx expo start -c
```

### Running on a Device / Emulator
- **Expo Go:** Download the "Expo Go" app on your iOS or Android device. Scan the QR code that appears in your terminal.
- **Android Emulator:** If you have Android Studio installed and an emulator running, press `a` in the terminal to open the app in the emulator.
- **Physical Android Phone:** Connect your Android phone via USB with USB Debugging enabled, and press `a` in the terminal to install and run the development build.

---

## Installing The APK

To install the production-ready app on any Android device:
1. Download the generated `.apk` file to your Android phone.
2. Tap the downloaded APK file to open it.
3. If Android prompts you with a security warning, click **Settings** and enable **"Allow installation from unknown sources"**.
4. Click **Install**.
5. Open the **New Malik Veterinary** app from your app drawer.
6. The local SQLite database will be created automatically on first launch.
7. If you are migrating to a new phone and have a backup, go to the Settings/Reports tab and use **Import Database** to restore your data.

---

## How To Build APK

This project uses EAS (Expo Application Services) to generate production APKs for Android.

If you haven't used EAS before, install the CLI and log in:
```bash
npm install -g eas-cli
eas login
```

To build the APK:
```bash
eas build -p android --profile preview
```

**What happens next?**
1. EAS will upload your project and build it in the cloud.
2. The terminal will provide a link to the Expo Dashboard where you can monitor the build progress.
3. Once the build finishes, the terminal (and the dashboard link) will provide a direct **Download URL** for the `.apk` file.
4. Download the APK, transfer it to your Android device via USB, Email, or WhatsApp, and install it following the instructions above.

---

## Import / Export Guide (Backup & Restore)

Because New Malik Veterinary is a completely offline app, **your data is only stored on your device**. You must create regular backups to ensure your business data is safe.

### Export / Backup
1. Open the app and navigate to the **Reports / Settings** screen.
2. Scroll to the Data Management section and tap **Export Database**.
3. The app will generate a `.sqlite` backup file containing all your products, sales, purchases, and customers.
4. The Android share menu will appear. **Save this file to Google Drive, email it to yourself, or share it to another device via WhatsApp/Bluetooth.**
5. Store the backup somewhere safe!

### Import / Restore
1. Install the New Malik Veterinary app on your new or reset phone.
2. Open the app.
3. Navigate to the **Reports / Settings** screen.
4. Tap **Import Database**.
5. Select the `.sqlite` backup file you previously saved.
6. A warning will appear asking if you want to replace current data. Confirm the import.
7. Wait for the success message.
8. **Fully close and reopen the app** to ensure the new database connection is initialized.
9. Verify that your products, stock, sales, and purchases are visible.

*Note: If you select a corrupted or invalid file (not a Vet Store database), the app will detect the error and reject the import to protect your system.*

---

## Backup Safety Warning
> [!WARNING]
> - **Always export a backup before uninstalling the app.** Uninstalling the app permanently deletes the local database.
> - Keep backups in a safe cloud location (like Google Drive) or a separate computer.
> - Keep more than one backup (e.g., weekly backups) in case the most recent one is corrupted.
> - **Never** delete your old backup until you have successfully imported and tested the new backup on your new device.
