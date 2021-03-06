import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AutoForm } from 'meteor/aldeed:autoform';
import { _ } from 'meteor/underscore';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';

import { displayError } from '/imports/ui_3/lib/errors.js';
import { __ } from '/imports/localization/i18n.js';
import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { debugAssert, productionAssert } from '/imports/utils/assert.js';
import { getActiveCommunityId, defaultNewDoc } from '/imports/ui_3/lib/active-community.js';
import { getActivePartnerId } from '/imports/ui_3/lib/active-partner.js';
import { importCollectionFromFile } from '/imports/ui_3/views/components/import-dialog.js';
import { BatchAction } from '/imports/api/batch-action.js';
import { Txdefs } from '/imports/api/transactions/txdefs/txdefs.js';
import { Transactions } from '/imports/api/transactions/transactions.js';
import '/imports/ui_3/views/components/transaction-view.js';

import './entities.js';
import './methods.js';

function figureOutEntity(options, doc) {
  const defId = doc.defId || options.txdef?._id;
//    || AutoForm.getFieldValue('defId') || ModalStack.getVar('defId');
  debugAssert(defId);
  const txdef = Txdefs.findOne(defId);
  if (!doc.defId) Transactions.setTxdef(doc, txdef);
  let entity = options.entity || txdef.category;
//    || doc.category || AutoForm.getFieldValue('category') || ModalStack.getVar('category');
  debugAssert(entity);
  if (typeof entity === 'string') entity = Transactions.entities[entity];
  return entity;
}
/*
function prefillDocWhenReconciling(doc) {
  const statementEntry = ModalStack.getVar('statementEntry');
  if (statementEntry) {
    _.deepExtend(doc, statementEntry?.match?.tx);
    doc.defId = AutoForm.getFieldValue('defId') || doc.defId; // the form choice overrides the match recommendation
  }
}
*/
Transactions.actions = {
  new: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'new',
    label: `${__('new') + ' ' + __('transaction')}`,
    icon: 'fa fa-plus',
    color: 'primary',
    visible: user.hasPermission('transactions.insert', doc),
    run() {
      doc = _.extend(defaultNewDoc(), doc);
      const entity = figureOutEntity(options, doc);
      doc = Transactions._transform(doc);
      const fillFromStatementEntry = function fillFromStatementEntry(instance) {
        const statementEntry = ModalStack.getVar('statementEntry');
        if (statementEntry) {
          const formId = instance.data.id;
          const doc = Transactions._transform(AutoForm.getDoc(formId));
          doc.fillFromStatementEntry(statementEntry);
          AutoForm.setDoc(doc, formId);
        }
      };

      Modal.show('Autoform_modal', {
        body: entity.editForm,
        bodyContext: { doc },
        onRendered: fillFromStatementEntry,
        // --- --- --- ---
        id: `af.${entity.name}.insert`,
        schema: Transactions.simpleSchema(doc),
        fields: entity.fields,
        omitFields: entity.omitFields && entity.omitFields(),
        doc,
        type: 'method',
        meteormethod: 'transactions.insert',
        // --- --- --- ---
        size: entity.size || 'md',
//        validation: entity.editForm ? 'blur' : undefined,
//        btnOK: `Insert ${entity.name}`,
      });
    },
  }),
  import: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'import',
    icon: 'fa fa-upload',
    visible: user.hasPermission('transactions.upsert', doc),
    run: () => importCollectionFromFile(Transactions, options),
  }),
  view: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'view',
    icon: 'fa fa-eye',
    visible: doc && (user.hasPermission('transactions.inCommunity', doc) || getActivePartnerId() === doc.partnerId),
    run() {
      const entity = Transactions.entities[doc.entityName()];
      Modal.show('Autoform_modal', {
        body: entity.viewForm,
        bodyContext: { doc },
        // --- --- --- ---
        id: `af.${entity.name}.view`,
        schema: Transactions.simpleSchema({ category: entity.name }),
        fields: entity.fields,
        omitFields: entity.omitFields && entity.omitFields(),
        doc,
        type: 'readonly',
        // --- --- --- ---
        size: entity.size || 'md',
      });
    },
  }),
  edit: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'edit',
    icon: 'fa fa-pencil',
    visible: doc && (!doc.isPosted() || doc.category === 'payment') // payment is allowed to be reallocated
      && !(doc.category === 'bill' && doc.relation === 'member') // cannot edit manually, use parcel billing
      && user.hasPermission('transactions.update', doc),
    run() {
      const entity = Transactions.entities[doc.entityName()];
      Modal.show('Autoform_modal', {
        body: entity.editForm,
        bodyContext: { doc },
        // --- --- --- ---
        id: `af.${entity.name}.update`,
        schema: Transactions.simpleSchema({ category: entity.name }),
        fields: entity.fields,
        omitFields: entity.omitFields && entity.omitFields(),
        doc,
        type: 'method-update',
        meteormethod: 'transactions.update',
        singleMethodArgument: true,
        // --- --- --- ---
        size: entity.size || 'md',
//        validation: entity.editForm ? 'blur' : undefined,
      });
    },
  }),
  post: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'post',
    icon: doc && doc.isPosted() ? 'fa fa-list' : 'fa fa-check-square-o',
    color: doc && doc.isPosted() ? undefined : 'warning',
    label: doc && doc.isPosted() ? 'Accounting view' : 'post',
    visible: doc && !(doc.category === 'bill' && !doc.hasConteerData())
      && user.hasPermission('transactions.post', doc),
    run() {
      if (doc.isPosted()) {
        Modal.show('Modal', {
          title: 'Accounting view',
          body: 'Transaction_view',
          bodyContext: { doc },
          size: 'lg',
        });
      } else {
//        if (options.batch) {
//          Transactions.methods.post.call({ _id: doc._id }, onSuccess((res) => {
//            displayMessage('info', 'actionDone_post');
//          })
//          );
//        } else {
        doc.makeJournalEntries(doc.community().settings.accountingMethod);
        Modal.confirmAndCall(Transactions.methods.post, { _id: doc._id }, {
          action: 'post transaction',
//            message: 'This will create the following journal entries',
          body: 'Transaction_view',
          bodyContext: { doc },
          size: 'lg',
        });
//      } else {
//        Transactions.methods.post.call({ _id: doc._id }, onSuccess((res) => {
//          displayMessage('info', 'Szamla konyvelesbe kuldve');
//        }));
      }
    },
  }),
  resend: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'resend',
    icon: 'fa fa-envelope',
    visible: doc && doc.isPosted() && user.hasPermission('transactions.resend', doc),
    run() {
      Modal.confirmAndCall(Transactions.methods.resend, { _id: doc._id }, {
        action: 'resend email',
        message: 'This will send the bill again',
      });
    },
  }),
  registerPayment: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'registerPayment',
    icon: 'fa fa-credit-card',
    color: 'info',
    visible: doc.community().settings.paymentsWoStatement && doc?.category === 'bill' && doc.outstanding
      && user.hasPermission('transactions.insert', doc),
    run() {
      ModalStack.setVar('billId', doc._id);
      const paymentDef = Txdefs.findOne({ communityId: doc.communityId, category: 'payment', 'data.relation': doc.relation });
      const paymentOptions = _.extend({}, options, { entity: Transactions.entities.payment, txdef: paymentDef });
      const paymentTx = {
        category: 'payment',
        defId: paymentDef._id,
        valueDate: new Date(),
        // - copied from the doc -
        relation: doc.relation,
        partnerId: doc.partnerId,
        contractId: doc.contractId,
        amount: doc.amount,
        bills: [{ id: doc._id, amount: doc.outstanding }],
      };
//      const paymentDoc = Transactions._transform(paymentTx);
      Transactions.actions.new(paymentOptions, paymentTx).run();
    },
  }),
  connectPayment: (options, doc, user = Meteor.userOrNull()) => {
    const connectablePayment = doc.category === 'bill' &&
      Transactions.findOne({ communityId: doc.communityId, category: 'payment', partnerId: doc.partnerId/*, outstanding: { $gte: 0 } */});
    return {
      name: 'connectPayment',
      icon: 'fa fa-credit-card',
      color: 'warning',
      visible: connectablePayment && doc.outstanding && user.hasPermission('transactions.update', doc),
      run() {
        ModalStack.setVar('billId', doc._id);
        Transactions.actions.edit({}, connectablePayment).run();
      },
    };
  },
  delete: (options, doc, user = Meteor.userOrNull()) => ({
    name: 'delete',
    label: doc.isPosted() ? 'storno' : 'delete',
    icon: 'fa fa-trash',
    visible: user.hasPermission('transactions.remove', doc) && (doc.status !== 'void'),
    run() {
      Modal.confirmAndCall(Transactions.methods.remove, { _id: doc._id }, {
        action: 'delete transaction',
        message: doc.isPosted() ? 'Remove not possible after posting' : 'It will disappear forever',
      }, (didIt, res) => {
        if (!didIt || !res) return;
        const stornoTx = Transactions.findOne(res);
        Meteor.setTimeout(Transactions.actions.view({}, stornoTx).run, 1000);
      });
    },
  }),
};

Transactions.dummyDoc = {
  communityId: getActiveCommunityId,
  isPosted() { return false; },
  isReconciled() { return false; },
};

Transactions.batchActions = {
  post: new BatchAction(Transactions.actions.post, Transactions.methods.batch.post, {}, Transactions.dummyDoc),
  delete: new BatchAction(Transactions.actions.delete, Transactions.methods.batch.remove, {}, Transactions.dummyDoc),
};

//-------------------------------------------------

Transactions.categoryValues.forEach(category => {
  AutoForm.addModalHooks(`af.${category}.insert`);
  AutoForm.addModalHooks(`af.${category}.update`);

  AutoForm.addHooks(`af.${category}.insert`, {
    docToForm(doc) {
      return doc;
    },
    formToDoc(doc) {
      if (category === 'bill' || category === 'receipt') {
        doc.lines = doc.lines?.filter(line => line);       // filters out undefined lines (placeholder)
      } else if (category === 'payment') {
        doc.bills = doc.bills?.filter(bill => bill?.amount);  // filters out undefined lines (placeholder), and zero amount rows
        doc.lines = doc.lines?.filter(line => line?.amount);
      }
      doc.debit = doc.debit?.filter(entry => entry);
      doc.credit = doc.credit?.filter(entry => entry);
/*
      try {
        const tdoc = Transactions._transform(doc);
        tdoc.validate?.();
        return doc;
      } catch (err) {
        displayError(err);
        return false;
      }
*/
      return doc;
    },
  });

  AutoForm.addHooks(`af.${category}.update`, {
/*
  formToModifier(modifier) {
    try {
      const tdoc = Transactions._transform(doc);
      tdoc.validate?.();
      return doc;
    } catch (err) {
      displayError(err);
      return false;
    }
  },
*/
  });
});
