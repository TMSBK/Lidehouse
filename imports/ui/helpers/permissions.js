import { Meteor } from 'meteor/meteor';
import { UI } from 'meteor/blaze';
import { Session } from 'meteor/session';

UI.registerHelper('userHasPermission', function userHasPermission(permission) {
  const user = Meteor.user();
  if (!user) return false;
  const activeCommunity = Session.get('activeCommunity');
  if (!activeCommunity) return false;
  return user.hasPermission(permission, activeCommunity._id);
});
