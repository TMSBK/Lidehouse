/* eslint no-param-reassign: "off" */
/* eslint func-names: ["error", "as-needed"] */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { __ } from '/imports/localization/i18n.js';
import { Timestamped } from '/imports/api/behaviours/timestamped.js';
import { ActivePeriod } from '/imports/api/behaviours/active-period.js';
import { Parcels } from '/imports/api/parcels/parcels.js';

export const Leaderships = new Mongo.Collection('leaderships');

let chooseLeadRef = {};
if (Meteor.isClient) {
  import { Session } from 'meteor/session';

  chooseLeadRef = {
    options() {
      const communityId = Session.get('activeCommunityId');
      const options = Parcels.find({ communityId }).fetch().map(function option(p) {
        return { label: p.ref, value: p.ref };
      });
      return options;
    },
    firstOption: () => __('(Select one)'),
  };
}

Leaderships.schema = new SimpleSchema({
  communityId: { type: String, regEx: SimpleSchema.RegEx.Id, autoform: { omit: true } },
  parcelId: { type: String, regEx: SimpleSchema.RegEx.Id, optional: false },
  leadRef: { type: String, optional: false, autoform: chooseLeadRef },
  leadParcelId: { type: String, regEx: SimpleSchema.RegEx.Id,
    autoValue() {
      const leadRef = this.field('leadRef').value;
      const communityId = this.field('communityId').value;
      return Parcels.findOne({ communityId, ref: leadRef })._id;
    },
  },
});

Meteor.startup(function indexLeaderships() {
  Leaderships.ensureIndex({ parcelId: 1 });
  Leaderships.ensureIndex({ leadParcelId: 1 });
  if (Meteor.isServer) {
    Leaderships._ensureIndex({ communityId: 1 });
  }
});

Leaderships.helpers({
  ledParcel() {
    return Parcels.findOne(this.parcelId);
  },
});

Leaderships.attachSchema(Leaderships.schema);
Leaderships.attachBehaviour(ActivePeriod);
Leaderships.attachBehaviour(Timestamped);

Meteor.startup(function attach() {
  Leaderships.simpleSchema().i18n('schemaLeaderships');
});