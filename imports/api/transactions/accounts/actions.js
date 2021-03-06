import { Meteor } from 'meteor/meteor';
import { AutoForm } from 'meteor/aldeed:autoform';
import { _ } from 'meteor/underscore';

import { __ } from '/imports/localization/i18n.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import '/imports/ui_3/views/modals/autoform-modal.js';
import { defaultNewDoc } from '/imports/ui_3/lib/active-community.js';
import { BatchAction } from '/imports/api/batch-action.js';
import { Accounts } from './accounts.js';
import './entities.js';
import './methods.js';

Accounts.actions = {
  new: (options, doc = defaultNewDoc(), user = Meteor.userOrNull()) => ({
    name: 'new',
    icon: 'fa fa-plus',
    color: 'primary',
    label: `${__('new')}  ${__(options.entity.name)}`,
//    label: (Array.isArray(options.entity) ? `${__('new')}  ${__('simpleAccount')}` : `${__('new')} ${__(/*'schemaAccounts.category.options.' + */options.entity.name)}`),
    visible: user.hasPermission('accounts.insert', doc),
//    subActions: options => Array.isArray(options.entity) && options.entity.length,
//    subActionsOptions: (options, doc) => options.entity.map(entity => ({ entity })),
    run() {
      const entity = options.entity;
      Modal.show('Autoform_modal', {
        id: `af.${entity.name}.insert`,
        schema: options.entity.schema,
        doc,
        type: 'method',
        meteormethod: 'accounts.insert',
      });
    },
  }),
  view: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'view',
    icon: 'fa fa-eye',
    visible: user.hasPermission('accounts.inCommunity', doc),
    run() {
      const entityName = doc.entityName();
      const entity = Accounts.entities[entityName];
      Modal.show('Autoform_modal', {
        id: `af.${entityName}.view`,
        schema: Accounts.simpleSchema(doc),
//        omitFields: ['category'],
        doc,
        type: 'readonly',
      });
    },
  }),
  edit: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'edit',
    icon: 'fa fa-pencil',
    visible: user.hasPermission('accounts.update', doc),
    run() {
      const entityName = doc.entityName();
      const entity = Accounts.entities[entityName];
      Modal.show('Autoform_modal', {
        id: `af.${entityName}.update`,
        schema: Accounts.simpleSchema(doc),
        omitFields: ['category'],
        doc,
        type: 'method-update',
        meteormethod: 'accounts.update',
        singleMethodArgument: true,
      });
    },
  }),
  delete: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'delete',
    icon: 'fa fa-trash',
    visible: user.hasPermission('accounts.remove', doc),
    run() {
      Modal.confirmAndCall(Accounts.methods.remove, { _id: doc._id }, {
        action: 'delete moneyAccount',
        message: 'Some accounting transactions might be connecting to it',
      });
    },
  }),
};

Accounts.batchActions = {
  delete: new BatchAction(Accounts.actions.delete, Accounts.methods.batch.remove),
};

//-----------------------------------------------

_.each(Accounts.entities, (entity, entityName) => {
  AutoForm.addModalHooks(`af.${entityName}.insert`);
  AutoForm.addModalHooks(`af.${entityName}.update`);
  AutoForm.addHooks(`af.${entityName}.insert`, {
    formToDoc(doc) {
      if (doc.code && doc.code.charAt(0) !== '`') doc.code = '`' + doc.code;
      return doc;
    },
  });
});
