import { Meteor } from 'meteor/meteor';

/* globals StatusBar */

// config for Android

Meteor.startup(() => {
  if (Meteor.isCordova) {
    StatusBar.hide();
  }
});

