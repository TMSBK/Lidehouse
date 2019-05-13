/* globals App */
/* eslint-disable quote-props */

App.configurePlugin('cordova-plugin-googleplus', {
  'REVERSED_CLIENT_ID': 'REVERSED_CLIENT_ID_FOR_cordova-plugin-googleplus',
});

App.configurePlugin('phonegap-plugin-push', {
  'SENDER_ID': 'SENDER_ID_FOR_phonegap-plugin-push',
});

App.info({
  name: 'LiDeHouse',
  description: 'Liquid Democracy comes to your doorsteps',
  author: 'KDE Alapítvány',
  email: 'daniel.roka@tutanota.com',
  website: 'http://github.com/edemo',
  version: '0.0.1',
});

App.icons({
  // iOS
  'iphone_2x': 'resources/icons/user-icon.png',
  'ipad': 'resources/icons/user-icon.png',
  'ipad_2x': 'resources/icons/user-icon.png',

  // Android
  'android_mdpi': 'resources/icons/user-icon.png',
  'android_hdpi': 'resources/icons/user-icon.png',
  'android_xhdpi': 'resources/icons/user-icon.png',
});

App.launchScreens({
  // iOS
  'iphone_2x': 'resources/splash/splash-320x480@2x.png',
  'iphone5': 'resources/splash/splash-320x568@2x.png',
  'ipad_portrait': 'resources/splash/splash-768x1024.png',
  'ipad_portrait_2x': 'resources/splash/splash-768x1024@2x.png',
  'ipad_landscape': 'resources/splash/splash-1024x768.png',
  'ipad_landscape_2x': 'resources/splash/splash-1024x768@2x.png',

  // Android
  'android_mdpi_portrait': 'resources/splash/splash-320x480.png',
  'android_mdpi_landscape': 'resources/splash/splash-480x320.png',
  'android_hdpi_portrait': 'resources/splash/splash-480x800.png',
  'android_hdpi_landscape': 'resources/splash/splash-800x480.png',
  'android_xhdpi_portrait': 'resources/splash/splash-720x1280.png',
  'android_xhdpi_landscape': 'resources/splash/splash-1280x720.png',
});

App.setPreference('StatusBarOverlaysWebView', 'false');
App.setPreference('StatusBarBackgroundColor', '#000000');
App.setPreference('android-minSdkVersion', 19);
