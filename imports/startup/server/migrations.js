import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';
import { Communities } from '/imports/api/communities/communities.js';
import { Topics } from '/imports/api/topics/topics.js';
import { Comments } from '/imports/api/comments/comments.js';
import { Parcels } from '/imports/api/parcels/parcels.js';
import { Leaderships } from '/imports/api/leaderships/leaderships.js';
import { Sharedfolders } from '/imports/api/shareddocs/sharedfolders/sharedfolders.js';
import { Breakdowns } from '/imports/api/transactions/breakdowns/breakdowns.js';

Migrations.add({
  version: 1,
  name: 'Add CreatedBy and UpdatedBy fields (and use CreatedBy insetad of userId)',
  up() {
    function upgrade(collection) {
      collection.find({ creatorId: { $exists: false } }).forEach(doc => {
        const creatorId = doc.userId;
        collection.update(doc._id, { $unset: { userId: 0 } });
        collection.update(doc._id, { $set: { creatorId } });
      });
    }
    upgrade(Topics);
    upgrade(Comments);
  },
});

Migrations.add({
  version: 2,
  name: 'Use communityId:null for the shared assets',
  up() {
    function upgrade(collection) {
      collection.update(
        { communityId: { $exists: false } },
        { $set: { communityId: null } },
        { multi: true }
      );
    }
    upgrade(Sharedfolders);
    upgrade(Breakdowns);
  },
});

Migrations.add({
  version: 3,
  name: 'Tickets get a type',
  up() {
    Topics.update(
      { category: 'ticket', 'ticket.type': { $exists: false } },
      { $set: { 'ticket.type': 'issue' } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 4,
  name: 'Topics all get a status',
  up() {
    Topics.find({ category: 'ticket' }).forEach((ticket) => {
      Topics.update(ticket._id, { $set: { status: ticket.ticket.status } });
    });
    Topics.update(
      { status: { $exists: false }, closed: false },
      { $set: { status: 'opened' } },
      { multi: true }
    );
    Topics.update(
      { status: { $exists: false }, closed: true },
      { $set: { status: 'closed' } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 5,
  name: 'Communities get a settings section and an accountingMethod',
  up() {
    Communities.update(
      { settings: { $exists: false } },
      { $set: { settings: { joinable: true, accountingMethod: 'accrual' } } },
      { multi: true }
    );
  },
});

Migrations.add({
  version: 6,
  name: 'Remove leadRef from parcel, and create leaderships with it',
  up() {
    function upgrade() {
      Parcels.find({ leadRef: { $exists: true } }).forEach((doc) => {
        Leaderships.insert({ communityId: doc.communityId, parcelId: doc._id, leadRef: doc.leadRef });
      });
    }
    upgrade();
  },
});


Meteor.startup(() => {
  Migrations.unlock();
  Migrations.migrateTo('latest');
});
