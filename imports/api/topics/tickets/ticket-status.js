import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { _ } from 'meteor/underscore';
//import { autoformOptions } from '/imports/utils/autoform.js';
import { Events } from '/imports/api/events/events.js';

// === Ticket statuses

const reported = {
  name: 'reported',
  color: 'warning',
  schema: new SimpleSchema({
  }),
//  actions: [],
//  permissions: [],
};

const confirmed = {
  name: 'confirmed',
  color: 'info',
  schema: new SimpleSchema({
    localizer: { type: String },
    expected: { type: Date, optional: true },
  }),
};

const scheduled = {
  name: 'scheduled',
  color: 'warning',
  schema: new SimpleSchema({
    text: { type: String, max: 5000, autoform: { rows: 8 } },
    expected: { type: Date, optional: true },
  }),
};

const progressing = {
  name: 'progressing',
  color: 'info',
  schema: new SimpleSchema({
    expected: { type: Date, optional: true },
  }),
};

const suspended = {
  name: 'suspended',
  color: 'warning',
  schema: new SimpleSchema({
    expected: { type: Date, optional: true },
  }),
};

const finished = {
  name: 'finished',
  color: 'primary',
  schema: new SimpleSchema({
  }),
};

const closed = {
  name: 'finished',
  color: 'default',
  schema: new SimpleSchema({
  }),
};

const deleted = {
  name: 'deleted',
  color: 'danger',
  schema: new SimpleSchema({
  }),
};

export const TicketStatuses = {
  reported, confirmed, scheduled, progressing, suspended, finished, closed, deleted,
};
export const TicketStatusNames = Object.keys(TicketStatuses);
TicketStatusNames.forEach(statusName => Events.categoryValues.push(`statusChangeTo.${statusName}`));

// == Ticket types:

export const TicketTypes = {
  reported: {
    start: 'reported',
    reported: {
      next: ['confirmed'],
    },
    confirmed: {
      next: ['progressing'],
    },
    progressing: {
      next: ['finished', 'suspended'],
    },
    suspended: {
      next: ['progressing'],
    },
    finished: {
      next: ['closed', 'progressing'],
    },
    closed: {
      next: [],
    },
    deleted: {
      next: ['reported'],
    },
  },
  scheduled: {
    start: 'scheduled',
    scheduled: {
      next: ['progressing'],
    },
    progressing: {
      next: ['finished'],
    },
    finished: {
      next: ['closed', 'progressing'],
    },
    closed: {
      next: [],
    },
    deleted: {
      next: ['scheduled'],
    },
  },
};
export const TicketTypeNames = Object.keys(TicketTypes);

export function possibleNextStatuses(topic) {
  return TicketTypes[topic.ticket.type][topic.ticket.status].next.concat('deleted');
}

export function statusSpecificSchema(statusName) {
  const statusObject = TicketStatuses[statusName];
  const schema = new SimpleSchema([Events.baseSchema, {
    data: { type: statusObject.schema, optional: true },
  }]);
  schema.i18n('schemaTicketStatusChange');
  return schema;
}

/*
export let possibleNextStatusesOnUI = () => {};
if (Meteor.isClient) {
  import { Session } from 'meteor/session';
  import { Topics } from '/imports/api/topics/topics.js';

  possibleNextStatusesOnUI = function () {
    const topicId = Session.get('activeTopicId');
    const topic = Topics.findOne(topicId);
    return possibleNextStatuses(topic);
  };
}
*/
