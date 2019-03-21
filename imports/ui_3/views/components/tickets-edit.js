import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { AutoForm } from 'meteor/aldeed:autoform';

import { Topics } from '/imports/api/topics/topics.js';
import { remove as removeTopic } from '/imports/api/topics/methods.js';
import { ticketsSchema } from '/imports/api/topics/tickets/tickets.js';
import { statusSpecificSchema } from '/imports/api/topics/tickets/ticket-status.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import '/imports/ui_3/views/modals/autoform-edit.js';
import '/imports/ui_3/views/modals/confirmation.js';

export function afTicketInsertModal() {
  const communityId = Session.get('activeCommunityId');
  const omitFields = ['agendaId', 'sticky', 'ticket.status'];
  if (!Meteor.user().hasPermission('ticket.update', communityId)) {
    omitFields.push('ticket.type');
    omitFields.push('ticket.category');
  }
  Modal.show('Autoform_edit', {
    id: 'af.ticket.insert',
    collection: Topics,
    schema: ticketsSchema,
    omitFields,
    type: 'method',
    meteormethod: 'topics.insert',
    template: 'bootstrap3-inline',
    btnOK: 'Create ticket',
  });
}

export function afTicketUpdateModal(topicId) {
  Modal.show('Autoform_edit', {
    id: 'af.ticket.update',
    collection: Topics,
    schema: ticketsSchema,
    omitFields: ['agendaId', 'sticky', 'ticket.status'],
    doc: Topics.findOne(topicId),
    type: 'method-update',
    meteormethod: 'topics.update',
    singleMethodArgument: true,
    template: 'bootstrap3-inline',
  });
}

export function afTicketStatusChangeModal(topicId, newStatusName) {
  Session.set('activeTopicId', topicId);
  Session.set('newStatusName', newStatusName);
  Modal.show('Autoform_edit', {
    id: 'af.ticket.statusChange',
    schema: statusSpecificSchema(newStatusName),
    omitFields: ['topicId'],
    type: 'method',
    meteormethod: 'ticket.statusChange',
    template: 'bootstrap3-inline',
    btnOK: 'Change status',
  });
}

export function deleteTicketConfirmAndCallModal(topicId) {
  Modal.confirmAndCall(removeTopic, { _id: topicId }, {
    action: 'delete ticket',
    message: 'It will disappear forever',
  });
}

AutoForm.addModalHooks('af.ticket.insert');
AutoForm.addModalHooks('af.ticket.update');
AutoForm.addModalHooks('af.ticket.statusChange');
AutoForm.addHooks('af.ticket.insert', {
  formToDoc(doc) {
    doc.communityId = Session.get('activeCommunityId');
    doc.userId = Meteor.userId();
    doc.category = 'ticket';
    if (!doc.ticket) doc.ticket = {};
    doc.ticket.type = doc.ticket.type || 'reported';
    doc.ticket.status = doc.ticket.type;
    return doc;
  },
});

AutoForm.addHooks('af.ticket.statusChange', {
  formToDoc(doc) {
    doc.topicId = Session.get('activeTopicId');
    doc.userId = Meteor.userId();
    doc.category = `statusChangeTo.${Session.get('newStatusName')}`;
    return doc;
  },
  onSuccess(formType, result) {
    Session.set('activeTopicId');  // clear it
  },
});
