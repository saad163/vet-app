# New Malik Veterinary Project Report

## 1. Project Overview
**New Malik Veterinary** is a comprehensive point-of-sale (POS) and inventory management mobile application specifically designed for veterinary stores and pharmacies. 

It solves the critical problem of tracking medical stock, managing expirations, and recording daily financial transactions seamlessly from a mobile device. The application operates **100% offline**, storing all sensitive business and financial data securely in a local database on the device without requiring an internet connection.

## 2. Technologies Used
- **React Native & Expo:** The core framework used for building the cross-platform mobile application, providing a native-like experience while writing JavaScript/TypeScript.
- **TypeScript:** Provides static typing over JavaScript, ensuring code reliability, auto-completion, and fewer runtime errors.
- **Expo SQLite:** The offline database engine used to store all application data (sales, products, stock) locally on the device.
- **Expo File System & Document Picker:** Utilized for creating raw database backups, exporting them, and allowing the user to import and restore their data.
- **Expo Print & Sharing:** Used to dynamically generate PDF reports for daily/monthly sales and share them externally via the native share sheet.
- **NativeWind (TailwindCSS):** Used for rapid, modern, and consistent UI styling across the application, achieving the professional teal/orange/red veterinary color theme.
- **Lucide React Native:** Provides clean, modern vector icons for the user interface.

## 3. Database Architecture
The application uses **SQLite** as its database. It is 100% **local**, operating directly on the device's storage. SQLite is used because it provides robust, relational data integrity while remaining lightweight and entirely offline.

### Important Tables
1. **products**: Stores master product definitions (name, category, brand, pricing, min stock alert).
2. **batches**: Stores individual stock entries for a product. Crucial for tracking `purchase_price`, `remaining_quantity`, and `expiry_date` uniquely across different shipments.
3. **purchases** & **purchase_items**: Records the event of adding new stock from a supplier.
4. **sales** & **sale_items**: Records customer transactions, calculating total amounts and tracking total profits based on the exact batches sold.
5. **returns** & **return_items**: Manages the logic of customer refunds, restoring stock back to the exact batch it was sold from, and adjusting net profits dynamically.
6. **customers**: Stores customer contact details.

## 4. Main Features
- **Dashboard:** Provides a top-level view of Today's Sales, Today's Profit, Total Products, and Total Stock. Features a modern quick-action grid and top-level critical alerts.
- **Products & Stock Management:** Create, edit, and deactivate products. Stock is tracked granularly via batches.
- **Purchases:** Add new stock to the inventory, capturing supplier details, purchase price, and batch expiry dates.
- **Sales (POS):** Process customer orders, automatically deducting stock using a FIFO (First-In-First-Out) logic, and calculating exact profit margins.
- **Returns & Refunds:** Robust system to process full or partial returns on completed sales. Automatically replenishes the correct batch inventory and adjusts financial reporting.
- **Alerts System:** Real-time tracking of Out of Stock, Low Stock, Near Expiry (within 30 days), and Expired items, with the ability to instantly resolve bad data directly from the alert.
- **Comprehensive Reports:** Generate Daily, Monthly, and Custom Date Range financial reports (calculating Net Sales after returns). Supports exporting these reports as PDF files.
- **Full Offline Backup/Restore:** Ability to export the entire raw `.sqlite` database for safe-keeping and import it on a different device to resume business operations.

## 5. How The App Works
The general lifecycle of operations is as follows:
1. **Product Setup:** Create a product master record (e.g., "Paracetamol").
2. **Purchase (Inbound):** Buy stock for the product. This creates a `purchase` and a `batch` with a specific `purchase_price` and `expiry_date`. Stock increases.
3. **Sale (Outbound):** Sell the product. The system automatically subtracts stock from the oldest available batch. `selling_price - purchase_price` is calculated as profit.
4. **Return (Reversal):** If a customer returns a product, the system refunds the amount, subtracts the profit, and adds the stock back to the exact batch it originated from.
5. **Monitoring:** The Dashboard continuously monitors all active batches and product quantities, bubbling up Expiry and Low Stock alerts to the user.
6. **Reporting:** Users generate PDF reports summarizing Net Sales and Profits over time.

## 6. Sales, Purchase & Return Logic
- **Stock Increases:** When a **Purchase** is logged, new `batches` are created. The sum of all active batches equals the product's total stock.
- **Stock Decreases:** When a **Sale** is logged, the system finds the oldest available batch (FIFO). If the order requires more items than the first batch holds, it exhausts the first batch and deducts the remainder from the next available batch.
- **Profit Calculation:** Profit is calculated precisely at the item level during a sale: `(Selling Price - Exact Batch Purchase Price) * Quantity`.
- **Returns:** When a return is processed, the app looks up the exact `sale_items`. It restores the returned quantity to the original `batch_id`, subtracts the refund amount from gross sales, and deducts the reversed profit from gross profit to yield the Net Financials.

## 7. Alerts System
The Alerts system proactively warns the store owner of critical business issues. Alerts are displayed directly on the top of the Dashboard.
- **Out of Stock:** Total remaining quantity across all batches is `0`.
- **Low Stock:** Total remaining quantity is less than or equal to the product's user-defined `min_stock_alert`.
- **Near Expiry:** A specific batch's expiry date is between tomorrow and 30 days from today.
- **Expired:** A specific batch's expiry date is today or earlier.
- **Resolution:** Clicking on an alert opens the Alert Details screen, allowing the user to edit the underlying Product details or the specific Batch data (like pushing the Expiry Date forward to correct a typo), immediately clearing the alert upon saving.

## 8. Reports & PDF
The Reports tab allows the user to monitor financial health.
- **Metrics:** Calculates Gross Sales, Total Refunds, Net Sales, and Net Profit.
- **Timeframes:** Filter by "Today", "This Month", or select a Custom Date Range using native date pickers.
- **PDF Generation:** Using `expo-print`, the app generates a highly formatted, printable HTML-to-PDF invoice/report of the selected timeframe's financial breakdown, which can then be shared or printed via the device's native share sheet.

## 9. Import / Export (Backup)
Because the app is 100% offline, data safety is handled via raw file exports.
- **Export:** The app serializes the current SQLite database (including all products, purchases, sales, returns, and customers) into a raw `.sqlite` file and opens the device share sheet so the user can save it to Google Drive, Email, or local storage.
- **Import:** To restore on another phone, the user taps "Import Database", selects the `.sqlite` file using the Document Picker, and the app gracefully replaces its live database with the backup file. It includes a built-in validation check to ensure only valid Vet Store databases are applied, preventing corruption.

## 10. How To Run The App
To run the app locally for development:
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Start Expo Server:**
   ```bash
   npx expo start -c
   ```
3. **Run on a Physical Device:** Download the "Expo Go" app from the Play Store/App Store. Scan the QR code displayed in your terminal using your phone's camera or the Expo Go app.
4. **Run on Android Emulator (if installed):**
   ```bash
   npx expo start --android
   ```

## 11. How To Build & Install APK
To generate a standalone APK that can be installed on Android devices without Expo Go:
1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo:**
   ```bash
   eas login
   ```
3. **Build the APK:**
   Execute the following command to build a local Android APK profile (requires `eas.json` to be configured with `"buildType": "apk"`):
   ```bash
   eas build -p android --profile preview
   ```
4. **Download & Transfer:** Once the build finishes on Expo's servers, you will receive a download link. Download the `.apk` file, transfer it to any Android phone via USB, Bluetooth, or WhatsApp, and tap the file in the phone's File Manager to install it.

## 12. How To Use The App
- **Adding a Product:** Go to *Products* -> Tap the `+` icon -> Fill in details and initial stock -> Save.
- **Adding a Purchase:** Go to *Purchases* -> Tap `+` -> Add products to the cart, specify expiry dates and purchase prices -> Complete Purchase.
- **Making a Sale:** Go to *Sales* -> Tap `+` -> Add items to cart -> Complete Sale.
- **Returning a Product:** Go to *Sales* -> Tap an existing sale -> Tap *Return Items* -> Select quantities to return -> Confirm.
- **Checking Alerts:** View the top section of the *Dashboard*. Tap any alert to edit and resolve it.
- **Creating Reports:** Go to *Settings & Reports* -> Select a Date Range -> View metrics or tap *Export PDF*.
- **Exporting Backup:** Go to *Settings & Reports* -> Tap *Export Database* -> Save to Drive/Files.

## 13. Project Structure
- `app/`: Contains the Expo Router screen definitions (the UI and navigation).
  - `_layout.tsx`: The root navigation stack.
  - `index.tsx`: The Dashboard view.
  - `alerts/`, `products/`, `sales/`, `purchases/`, `reports/`: Dedicated UI folders for each feature.
- `src/db/`: Contains the core business logic and SQLite queries (data access layer).
  - `products.ts`, `sales.ts`, `purchases.ts`, `returns.ts`, `dashboard.ts`: Logic specific to those domains.
  - `backup.ts`: Logic for importing/exporting the raw database file.
- `src/types/`: TypeScript interfaces defining the shape of Database models (e.g., `Sale`, `Batch`, `Product`).
- `database/`: Contains the SQLite initialization logic and table schemas (`index.ts`).

## 14. Troubleshooting
- **App Not Starting (Metro Bundler Errors):** Run `npx expo start -c` to clear the cache.
- **Database Import Fails (Invalid Database):** The app only accepts `.sqlite` files generated by the app. Ensure the file wasn't modified or corrupted during transfer via WhatsApp/Email.
- **Stock Not Deducting:** Ensure the product has active `batches` with `remaining_quantity > 0`. You cannot sell a product with 0 stock.
- **PDF Not Generating:** Ensure the device has a default PDF viewer installed, and that storage/sharing permissions are granted to the Expo Go app.

## 15. Final Summary
New Malik Veterinary is a robust, entirely offline, mobile-first inventory and POS system. Its primary strength lies in its meticulous tracking of exact batch economics and expirations, ensuring that veterinary store owners have complete, localized control over their stock tracking, financial reporting, and data security without needing a continuous internet connection.
