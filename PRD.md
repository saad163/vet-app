# Product Requirements Document (PRD): Veterinary Store Management App

## 1. Project Overview
The Veterinary Store Management App is a fully offline, local-first Android application designed specifically for veterinary clinics and pet medicine stores. It enables store owners and managers to completely manage their business operations, inventory, and sales without requiring an active internet connection or a backend server.

### 1.1 Objective
Provide a lightweight, secure, and fully offline mobile solution for veterinary store owners to manage products, execute sales using strict FIFO (First-In, First-Out) inventory logic, calculate accurate profit margins, and monitor stock levels via an alerts system.

## 2. Target Audience
- Veterinary clinic owners
- Pet store managers
- Veterinary pharmacy staff

## 3. Technology Stack
- **Framework:** React Native with Expo (Expo Router)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Local Database:** SQLite (`expo-sqlite`)
- **Icons:** Lucide React Native
- **File Management (Backup/Restore):** `expo-file-system`, `expo-document-picker`, `expo-sharing`

## 4. Core Features & Requirements

### 4.1 Product Management
- Create, read, update, and delete (CRUD) product profiles.
- Define product details including name, minimum selling price, maximum selling price, and a low-stock alert threshold.

### 4.2 Purchase & Inventory Management (Batches)
- Record incoming stock purchases.
- Store inventory using a "Batch" system (each purchase creates a distinct batch with its own purchase price, expiry date, and quantity).
- Track expiry dates to prevent selling expired medicines.

### 4.3 Sales Engine & FIFO Logic
- Process customer sales and deduct inventory securely using local SQLite transactions.
- **Strict FIFO Processing:** The engine must automatically deduct units from the oldest available batches first to minimize waste.
- **Profit Calculation:** Accurately calculate profit by mapping the exact cost of the specific batch units being sold against the final selling price.
- Validate that the sale price remains within the product's defined minimum and maximum thresholds.

### 4.4 Alerts & Dashboard
- **Dashboard:** Provide a live overview of Today's Sales, Today's Profit, Total Stock, and Total Products.
- **Alerts System:** Automatically identify and notify the user about:
  - Products that are completely out of stock.
  - Products falling below their custom minimum stock threshold.
  - Specific inventory batches expiring within the next 30 days.

### 4.5 Reporting
- **Daily Reports:** Summarize total revenue and profit generated on a specific day.
- **Monthly Reports:** Aggregate sales performance across a selected month.
- **Product Leaderboard:** Rank products based on the highest quantity sold and total profit generated.

### 4.6 Customer Management
- Record basic customer profiles (Name, Phone number, Email) for reference during sales.

### 4.7 Offline Data Security & Backup
- **100% Local Storage:** No cloud database or internet API requests.
- **Database Export:** Allow the user to export the internal SQLite `.db` file using native Android sharing to physical storage, email, or Google Drive.
- **Database Import:** Allow users to restore their database from a `.db` file to seamlessly migrate to a new device or recover from a backup.

## 5. Non-Functional Requirements
- **Performance:** Database queries must run synchronously and smoothly on standard Android devices.
- **UI/UX:** The interface should be professional, clean, and intuitive, utilizing a modern color palette (blue/gray) and responsive components.
- **Reliability:** Data corruption must be prevented by wrapping complex writes (like sales batch deductions) inside strict SQL transactions. If any step fails, the entire sale should roll back.
