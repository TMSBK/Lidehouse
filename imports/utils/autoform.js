import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { __ } from '/imports/localization/i18n.js';

export const autoformOptions = function autoformOptions(values, i18Path = '') {
  return {
    options() {
      return values.map(function option(t) { return { label: __(i18Path + t), value: t }; });
    },
  };
};

export const chooseUser = {
  options() {
    const users = Meteor.users.find({});
    const options = users.map(function option(u) {
      return { label: u.displayName(), value: u._id };
    });
    const sortedOptions = _.sortBy(options, o => o.label.toLowerCase());
    return sortedOptions;
  },
};

