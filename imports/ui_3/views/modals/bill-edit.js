import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import { AutoForm } from 'meteor/aldeed:autoform';
import { moment } from 'meteor/momentjs:moment';
import { Clock } from '/imports/utils/clock';

import { __ } from '/imports/localization/i18n.js';
import { Bills } from '/imports/api/transactions/bills/bills.js';
import { Localizer } from '/imports/api/transactions/breakdowns/localizer.js';
import '/imports/api/transactions/bills/actions.js';

import './bill-edit.html';


Template.Bill_edit.actionFromId = function () {
  const instance = Template.instance();
  const split = instance.data.id.split('.'); // AutoFormId convention is 'af.object.action'
  const objectName = split[1];
  const actionName = split[2];
  return actionName;
};

Template.Bill_edit.onCreated(function billEditOnCreated() {
});

Template.Bill_edit.helpers({
  activePartnerRelation() {
    return Session.get('activePartnerRelation');
  },
  title() {
    if (this.title) return this.title;
    const actionName = Template.Bill_edit.actionFromId();
    const relation = Session.get('activePartnerRelation');
    const billType = __(`schemaBills.relation.${relation}`);
    if (actionName === 'insert') return __('new') + ' ' + __(billType);
    else if (actionName === 'update') return __(billType) + ' ' + __('editing data');
    else if (actionName === 'view') return __(billType) + ' ' + __('viewing data');
    else return 'data';
  },
  btnOK() {
    const actionName = Template.Bill_edit.actionFromId();
    if (actionName === 'insert') return 'Insert bill';
    else if (actionName === 'update') return 'save';
    else if (actionName === 'view') return 'OK';
    else return '';
  },
  defaultDate() {
    return Clock.currentTime();
  },
  defaultDueDate() {
    return moment().add(30, 'day').toDate();
  },
  lineTotal(afLine) {
    function getLineField(fieldName) {
      return AutoForm.getFieldValue(afLine.name + '.' + fieldName);
    }
    let amount = getLineField('unitPrice') * getLineField('quantity');
    const tax = (amount * getLineField('taxPct')) / 100;
    amount += tax;
    return amount;
  },
  billTotal(which) {
    let net = 0;
    let tax = 0;
    let gross = 0;
    AutoForm.getFieldValue('lines').forEach(line => {
      let lineAmount = line.unitPrice * line.quantity;
      const lineTax = (lineAmount * line.taxPct) / 100;
      net += lineAmount;
      tax += lineTax;
      lineAmount += lineTax;
      gross += lineAmount;
    });
    return { net, tax, gross }[which];
  },
});

Template.Bill_edit.events({
});