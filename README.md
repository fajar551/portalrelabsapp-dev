# 🚀 PortalRelabsApp-Dev

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-0.79.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=for-the-badge&logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-22.2.0-orange?style=for-the-badge&logo=firebase)

**Modern and Integrated Relabs Portal Application** 📱

</div>

---

## 📋 About the Application

**PortalRelabsApp-Dev** is a mobile application built with React Native for managing the Relabs portal. This application provides various features for account management, payments, support tickets, and real-time notifications.

### ✨ Key Features

- 🔐 **Multi-Platform Authentication**

  - Email/password login
  - WhatsApp login
  - OTP code verification
  - Password reset

- 💳 **Payment System**

  - Invoice details
  - Payment instructions
  - Payment confirmation
  - Payment status

- 🎫 **Ticket Management**

  - Create new tickets
  - Ticket details
  - Ticket status tracking

- 🔔 **Real-time Notifications**

  - Push notifications with Firebase
  - Email notifications
  - Custom notification channels

- 👤 **Account Management**
  - User profile
  - Account settings
  - Auto logout

## 🛠️ Technologies Used

### Frontend

- **React Native** 0.79.2 - Cross-platform mobile framework
- **TypeScript** 5.0.4 - Type safety and developer experience
- **React Navigation** 7.x - Page navigation
- **React Native Vector Icons** - Icon library

### Backend & Services

- **Firebase** - Push notifications and messaging
- **Axios** - HTTP client for API calls
- **AsyncStorage** - Local storage

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **Metro** - JavaScript bundler

## 🚀 Getting Started

### Prerequisites

Before running the application, make sure you have installed:

- **Node.js** (version 18 or higher)
- **React Native CLI**
- **Android Studio** (for Android)
- **Xcode** (for iOS - macOS only)
- **Java Development Kit (JDK)**

### 📦 Installation

1. **Clone repository**

   ```bash
   git clone [REPOSITORY_URL]
   cd PortalRelabsApps
   ```

2. **Install dependencies**

   ```bash
   # Using npm
   npm install

   # Or using Yarn
   yarn install
   ```

3. **Setup iOS (macOS only)**
   ```bash
   # Install CocoaPods dependencies
   bundle install
   bundle exec pod install
   ```

### 🏃‍♂️ Running the Application

#### Android

```bash
# Start Metro bundler
npm start

# In a new terminal, run Android app
npm run android
```

#### iOS

```bash
# Start Metro bundler
npm start

# In a new terminal, run iOS app
npm run ios
```

## 📱 Application Structure

```
PortalRelabsApps/
├── app/
│   ├── components/          # Reusable components
│   └── screens/            # Application pages
│       ├── LoginScreen.tsx
│       ├── HomeScreen.tsx
│       ├── PayScreen.tsx
│       ├── AccountScreen.tsx
│       └── ...
├── src/
│   └── services/           # API services
├── android/               # Android configuration
├── ios/                   # iOS configuration
└── config/               # Configuration files
```

## 🔧 Available Scripts

| Script            | Description              |
| ----------------- | ------------------------ |
| `npm start`       | Run Metro bundler        |
| `npm run android` | Build and run on Android |
| `npm run ios`     | Build and run on iOS     |
| `npm run lint`    | Run ESLint               |
| `npm test`        | Run unit tests           |

## 🔐 Firebase Configuration

The application uses Firebase for push notifications. Make sure the Firebase configuration files are properly set up:

1. Download `google-services.json` for Android
2. Download `GoogleService-Info.plist` for iOS
3. Place the files in the appropriate folders

## 📱 Screen Features

### Authentication

- **LoginScreen** - Email/password login
- **WhatsAppLoginScreen** - WhatsApp login
- **VerifyCodeScreen** - OTP verification
- **ForgotPasswordScreen** - Password reset
- **ResetPasswordScreen** - Set new password

### Main Features

- **HomeScreen** - Main dashboard
- **PayScreen** - Payment page
- **InvoiceDetailScreen** - Invoice details
- **PaymentInstructionsScreen** - Payment instructions
- **PaymentSuccessScreen** - Success confirmation

### Support & Account

- **OpenTicketScreen** - Create new ticket
- **TicketDetailScreen** - Ticket details
- **NotificationScreen** - Notifications
- **AccountScreen** - Account management
- **HelpScreen** - Help and support

## 🔔 Push Notifications

The application supports push notifications with features:

- **Background messaging** - Notifications when app is closed
- **Foreground messaging** - Notifications when app is open
- **Custom notification channels** - Special channels for Android
- **Deep linking** - Direct navigation to specific pages

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 Production Build

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

```bash
cd ios
xcodebuild -workspace PortalRelabsApps.xcworkspace -scheme PortalRelabsApps -configuration Release archive
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter issues or have questions:

- 📧 Email: [support@relabs.com]
- 📱 WhatsApp: [+62 xxx-xxxx-xxxx]
- 🐛 Issues: [GitHub Issues]

---

<div align="center">

**Made with ❤️ by Relabs Team**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.2-blue?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-22.2.0-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)

</div>
