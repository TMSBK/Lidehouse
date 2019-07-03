import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { _ } from 'meteor/underscore';
import { checkExists, checkPermissions } from '/imports/api/method-checks.js';
import { toggleElementInArray } from '/imports/api/utils.js';

export const flagsSchema = new SimpleSchema({
  flags: { type: Array, defaultValue: [], autoform: { omit: true } },
  'flags.$': { type: String, regEx: SimpleSchema.RegEx.Id },   // userIds
});

export const flagsHelpers = {
  getFlags() {
    return this.flags || [];
  },
  isFlaggedBy(userId) {
    return _.contains(this.getFlags(), userId);
  },
  flagsCount() {
    return this.getFlags().length;
  },
  flaggedBy(userId, communityId) {
    if (this.flagsCount() >= 3
      /* && this.flagsCount() >= this.likesCount() */) {
      return 'community';
    }
    let result;
    this.getFlags().forEach((flaggerId) => {
      if (flaggerId === userId) result = 'you';
      const flagger = Meteor.users.findOne(flaggerId);
      if (flagger.hasPermission('topic.hide.forOthers', communityId)) result = 'moderator';
    });
    return result;
  },
};

export const flag = new ValidatedMethod({
  name: 'flag',
  validate: new SimpleSchema({
    coll: { type: String },
    id: { type: String, regEx: SimpleSchema.RegEx.Id },
  }).validator(),
  run({ coll, id }) {
    const collection = Mongo.Collection.get(coll);
    const object = checkExists(collection, id);
    const userId = this.userId;

    checkPermissions(userId, 'flag.toggle', object.community()._id, object);

    // toggle Flag status of this user
    toggleElementInArray(collection, id, 'flags', userId);
  },
});
