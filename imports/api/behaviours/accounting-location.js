import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const schema = new SimpleSchema({
  // Stores an accounting balance:
  outstanding: { type: Number, decimal: true, defaultValue: 0, autoform: { omit: true } },
});

const publicFields = {
  'outstanding': 0,
};

const indexes = function indexAccountingLocation(collection) {
  if (Meteor.isServer) {
    collection._ensureIndex({ communityId: 1, outstanding: -1 }, { sparse: true });
  }
};

const helpers = {
  hasOutstanding() {
    return this.outstanding > 0;
  },
};

export function checkNoOutstanding(doc) {
  if (doc.outstanding) {
    throw new Meteor.Error('err_unableToRemove',
      'Accounting location cannot be deleted while it has outstanding balance', `Outstanding: {${doc.outstanding}}`);
  }
}

function hooks(collection) {
  return {
//    before: {
//      remove(userId, doc) {
//        checkNoOutstanding(doc);
//        return true;
//      },
//    },
  };
}

export const AccountingLocation = { name: 'AccountingLocation',
  schema, publicFields, indexes, helpers, hooks,
};
