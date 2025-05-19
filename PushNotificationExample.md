# Implementasi Push Notification di React Native untuk Android

## Langkah 1: Install Package yang Diperlukan

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

## Langkah 2: Setup Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Tambahkan aplikasi Android ke project Firebase
3. Download file `google-services.json` dan simpan di folder `android/app`
4. Update `android/build.gradle`:

```gradle
buildscript {
  dependencies {
    // ... existing dependencies
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

5. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // tambahkan ini

dependencies {
  // ... existing dependencies
  implementation platform('com.google.firebase:firebase-bom:32.2.2')
  implementation 'com.google.firebase:firebase-analytics'
}
```

## Langkah 3: Konfigurasi Manifest

Edit file `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- ... existing permissions -->
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

  <application>
    <!-- ... existing application components -->

    <!-- Tambahkan Service ini -->
    <service
      android:name=".java.MyFirebaseMessagingService"
      android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>

    <!-- Untuk icon notifikasi -->
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_icon"
      android:resource="@drawable/ic_notification" />
    <meta-data
      android:name="com.google.firebase.messaging.default_notification_color"
      android:resource="@color/notification_color" />
  </application>
</manifest>
```

## Langkah 4: Custom Firebase Messaging Service (Opsional)

Buat file baru di `android/app/src/main/java/com/portalrelabsapps/MyFirebaseMessagingService.kt`:

```kotlin
package com.portalrelabsapps

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Periksa apakah pesan berisi data payload
        remoteMessage.data.isNotEmpty().let {
            if (remoteMessage.notification != null) {
                sendNotification(
                    remoteMessage.notification?.title ?: "Notifikasi Baru",
                    remoteMessage.notification?.body ?: "Anda memiliki pesan baru",
                    remoteMessage.data
                )
            }
        }
    }

    private fun sendNotification(title: String, messageBody: String, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java)
        // Tambahkan data ke intent jika perlu
        data.forEach { (key, value) ->
            intent.putExtra(key, value)
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "fcm_default_channel"
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Android Oreo ke atas memerlukan notification channel
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Channel Notifikasi Utama",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Channel utama untuk notifikasi aplikasi"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(0, notificationBuilder.build())
    }
}
```

## Langkah 5: Buat Icon Notifikasi

Buat file drawable `android/app/src/main/res/drawable/ic_notification.xml`:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32L13.5,4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2zM16,17L8,17v-6c0,-2.48 1.51,-4.5 4,-4.5s4,2.02 4,4.5v6z"/>
</vector>
```

Dan tambahkan color di `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="notification_color">#FD7E14</color>
</resources>
```

## Langkah 6: Implementasi React Native untuk Push Notification

Buat file `app/services/NotificationService.js`:

```javascript
import React, {useEffect} from 'react';
import {Platform, Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    getFCMToken();
  }
}

async function getFCMToken() {
  // Cek token yang telah tersimpan
  let fcmToken = await AsyncStorage.getItem('fcmToken');

  if (!fcmToken) {
    try {
      fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  } else {
    console.log('FCM Token from storage:', fcmToken);
  }

  // Di sini Anda bisa mengirim token ke server backend Anda
  // untuk mengirim push notification ke perangkat pengguna
}

export const NotificationListener = () => {
  useEffect(() => {
    // Untuk pesan yang datang ketika aplikasi di foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Notifikasi diterima di foreground:', remoteMessage);
      Alert.alert(
        remoteMessage.notification?.title || 'Notifikasi Baru',
        remoteMessage.notification?.body || 'Anda memiliki pesan baru',
      );
    });

    // Untuk pesan yang datang ketika aplikasi di background dan user tap notifikasi
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notifikasi dibuka dari background state:', remoteMessage);
      // Navigasi ke screen tertentu jika diperlukan berdasarkan data notifikasi
    });

    // Untuk pesan yang datang ketika aplikasi di terminated (closed) state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notifikasi dibuka dari killed state:', remoteMessage);
          // Navigasi ke screen tertentu jika diperlukan berdasarkan data notifikasi
        }
      });

    // Callback ketika token FCM di-refresh
    messaging().onTokenRefresh(token => {
      AsyncStorage.setItem('fcmToken', token);
      console.log('Token di-refresh:', token);
      // Kirim token baru ke server Anda
    });

    return unsubscribe;
  }, []);

  return null;
};
```

## Langkah 7: Gunakan Service di App.js

Update `App.js` atau `App.tsx`:

```javascript
import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
// ... import lainnya
import {
  requestUserPermission,
  NotificationListener,
} from './app/services/NotificationService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Minta izin notifikasi saat aplikasi pertama kali dibuka
    requestUserPermission();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <NotificationListener />
      {/* Komponen aplikasi utama Anda */}
    </>
  );
}

export default App;
```

## Langkah 8: Mengirim Notifikasi Uji dari Firebase Console

1. Buka Firebase Console > Messaging
2. Klik "Create your first campaign" atau "New campaign"
3. Pilih "Notification"
4. Isi judul dan teks notifikasi
5. Target ke app Android Anda
6. Jadwalkan pengiriman segera
7. Kirim notifikasi

## Contoh Tampilan Notifikasi di Android

Notifikasi akan muncul seperti ini di area notifikasi Android:

```
┌──────────────────────────────────────┐
│ 🔔 Judul Notifikasi                  │
│ Isi pesan notifikasi akan tampil di  │
│ sini dan dapat mencakup beberapa     │
│ baris teks.                          │
└──────────────────────────────────────┘
```

Saat diterima, notifikasi akan:

- Muncul di area notifikasi
- Menampilkan icon yang telah dikonfigurasi
- Mengeluarkan suara default
- Bergetar (jika diizinkan)
- Saat diketuk, membuka aplikasi Anda

## Fitur Push Notification Lanjutan

1. **Notifikasi dengan Gambar**:

   ```javascript
   // Di server, tambahkan properti imageUrl
   {
     "notification": {
       "title": "Promo Spesial!",
       "body": "Dapatkan diskon 50% hari ini saja",
       "imageUrl": "https://example.com/promo.jpg"
     }
   }
   ```

2. **Notifikasi dengan Tindakan (Actions)**:

   ```kotlin
   // Di MyFirebaseMessagingService.kt
   val actionIntent = PendingIntent.getActivity(...)

   notificationBuilder
     .addAction(R.drawable.ic_action, "Lihat", actionIntent)
     .addAction(R.drawable.ic_dismiss, "Abaikan", dismissIntent)
   ```

3. **Notifikasi dengan Grup**:

   ```kotlin
   // Grup beberapa notifikasi bersama
   notificationBuilder.setGroup("group_key")
   ```

4. **Notifikasi dengan Prioritas Tinggi**:
   ```kotlin
   notificationBuilder
     .setPriority(NotificationCompat.PRIORITY_HIGH)
     .setCategory(NotificationCompat.CATEGORY_ALARM)
   ```
