import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { TAPi18n } from 'meteor/tap:i18n';
import { datatables_i18n } from 'meteor/ephemer:reactive-datatables';
import { Fraction } from 'fractional';

import { ModalStack } from '/imports/ui_3/lib/modal-stack.js';
import { DatatablesExportButtons, DatatablesSelectButtons } from '/imports/ui_3/views/blocks/datatables.js';
import { __ } from '/imports/localization/i18n.js';
import { leaderRoles, nonLeaderRoles, officerRoles, rolesPriorities } from '/imports/api/permissions/roles.js';
import { Communities } from '/imports/api/communities/communities.js';
import '/imports/api/communities/actions.js';
import { getActiveCommunityId } from '/imports/ui_3/lib/active-community';
import { Parcels } from '/imports/api/parcels/parcels.js';
import '/imports/api/parcels/actions.js';
import { parcelColumns, highlightMyRow } from '/imports/api/parcels/tables.js';
import { Memberships } from '/imports/api/memberships/memberships.js';
import '/imports/api/memberships/actions.js';
import { Parcelships } from '/imports/api/parcelships/parcelships.js';
import '/imports/api/parcelships/actions.js';
import { Meters } from '/imports/api/meters/meters.js';
import '/imports/api/meters/actions.js';
import '/imports/api/users/users.js';
import '/imports/api/users/actions.js';
import { actionHandlers } from '/imports/ui_3/views/blocks/action-buttons.js';
import '/imports/ui_3/views/components/active-archive-tabs.js';
import '/imports/ui_3/views/blocks/simple-reactive-datatable.js';
import '/imports/ui_3/views/common/page-heading.js';
import '/imports/ui_3/views/components/contact-long.js';
import '/imports/ui_3/views/blocks/active-period.js';
import '/imports/ui_3/views/blocks/menu-overflow-guard.js';
import '/imports/ui_3/views/components/partners-table.js';
import './community-page.html';

Template.Roleships_box.viewmodel({
  autorun() {
    const communityId = this.templateInstance.data.communityId();
    this.templateInstance.subscribe('memberships.inCommunity', { communityId });
  },
  officers() {
    const communityId = this.templateInstance.data.communityId();
    const list = Memberships.findActive({ communityId, role: { $in: officerRoles } }, { sort: { createdAt: 1 } }).fetch();
    return _.sortBy(list, m => rolesPriorities[m.role]);
  },
});

Template.Occupants_table.viewmodel({
  memberships() {
    const selector = this.templateInstance.data.selector;
    return Memberships.find(selector, { sort: { role: -1 } });
  },
  parcelships() {
    const selector = this.templateInstance.data.selector;
    return Parcelships.find(selector);
  },
});

Template.Occupants_box.viewmodel({
  autorun() {
    const parcelId = this.templateInstance.data.parcel._id;
    this.templateInstance.subscribe('parcelships.ofParcel', { parcelId });
  },
  membershipsContent() {
    const parcelId = this.templateInstance.data.parcel._id;
    const selector = { parcelId };
    return { collection: 'memberships', selector };
  },
  parcelDisplay() {
    const parcel = this.templateInstance.data.parcel;
    return parcel ? parcel.display() : __('unknown');
  },
  parcelshipTitle() {
    const parcelId = this.templateInstance.data.parcel._id;
    const parcelship = Parcelships.findOne({ parcelId });
    return parcelship ? ` - ${__('parcelship')}` : '';
  },
});

Template.Meters_table.viewmodel({
  rows() {
    const selector = this.templateInstance.data.selector;
    return Meters.find(selector);
  },
});

Template.Meters_box.viewmodel({
  parcelDisplay() {
    const parcel = this.templateInstance.data.parcel;
    return parcel ? parcel.display() : __('unknown');
  },
  metersContent() {
    const communityId = this.templateInstance.data.community._id;
    const parcelId = this.templateInstance.data.parcel._id;
    const selector = { communityId, parcelId };
    return { collection: 'meters', selector };
  },
});

Template.Parcels_box.viewmodel({
  showAllParcels: false,
  onCreated() {
    const user = Meteor.user();
    const communityId = this.templateInstance.data.communityId();
    const parcelsCount = Parcels.find({ communityId, leadRef: { $exists: false } }).count();
    const showAllParcelsDefault = (
      (user?.hasPermission('parcels.insert', { communityId })) || (parcelsCount <= 80)
    );
    this.showAllParcels(!!showAllParcelsDefault);
  },
  autorun() {
    const communityId = this.templateInstance.data.communityId();
    this.templateInstance.subscribe('memberships.inCommunity', { communityId });
    if (this.showAllParcels()) {
      this.templateInstance.subscribe('parcels.inCommunity', { communityId });
      this.templateInstance.subscribe('parcelships.inCommunity', { communityId });
    } else {
      this.templateInstance.subscribe('parcels.ofSelf', { communityId });
    }
  },
  parcels() {
    const communityId = this.templateInstance.data.communityId();
    return Parcels.find({ communityId, category: '@property' });
  },
  parcelsTableContent() {
    const communityId = this.templateInstance.data.communityId();
    return {
      collection: 'parcels',
      selector: { communityId, category: '@property' },
      options() {
        return () => {
          return {
            columns: parcelColumns(),
            createdRow: highlightMyRow,
            tableClasses: 'display',
            language: datatables_i18n[TAPi18n.getLanguage()],
            lengthMenu: [[25, 100, 250, -1], [25, 100, 250, __('all')]],
            pageLength: 25,
            ...DatatablesExportButtons,
            ...DatatablesSelectButtons(Parcels),
          };
        };
      },
    };
  },
});

Template.Community_page.viewmodel({
  onCreated() {
    ModalStack.setVar('relation', 'member', true);
  },
  onRendered() {
    // Add slimscroll to element
    $('.full-height-scroll').slimscroll({
      height: '100%',
    });
  },
  autorun: [
    function subscription() {
      const communityId = this.communityId();
      this.templateInstance.subscribe('communities.byId', { _id: communityId });
    },
  ],
  communityId() {
    return FlowRouter.getParam('_cid') || getActiveCommunityId();
  },
  communityIdObject() {
    return { communityId: this.communityId() };
  },
  community() {
    return Communities.findOne(this.communityId());
  },
  reactiveContext() {
    const self = this;
    return {
      communityId: () => self.communityId(),
      communityIdObject: () => self.communityIdObject(),
      community: () => self.community(),
    };
  },
  communities() {
    return Communities;
  },
  title() {
    const community = this.community();
    return `${__('Community page')} - ${community && community.name}`;
  },
  /*  thingsToDisplayWithCounter() {
      const result = [];
      const communityId = Template.instance().getCommunityId();
      result.push({
        name: 'owner',
        count: Memberships.findActive({ communityId, role: 'owner' }).count(),
      });
      Parcels.typeValues.forEach(type =>
        result.push({
          name: type,
          count: Parcels.find({ communityId, type }).count(),
        })
      );
      return result;
    },*/
  activeTabClass(index) {
    return index === 0 ? 'active' : '';
  },
  parcelTypesWithCount() {
    const community = this.community();
    const result = [];
    if (!community) return [];
    Object.keys(community.parcels).forEach(k => {
      result.push({ type: k, count: community.parcels[k] });
    });
    return result;
  },
});

Template.Occupants_box.events({
  'click .js-member'(event, instance) {
    const id = $(event.target).closest('[data-id]').data('id');
    const membership = Memberships.findOne(id);
    const partner = membership.partner();
    Meteor.users.actions.view({}, partner.user()).run();
  },
  'click .js-occupants'(event, instance) {
    const id = $(event.target).closest('[data-id]').data('id');
    const parcel = Parcels.findOne(id);
    Parcels.actions.occupants({}, parcel).run();
  },
});

Template.Parcels_box.events({
  'click .parcels .js-show-all'(event, instance) {
    const oldVal = instance.viewmodel.showAllParcels();
    instance.viewmodel.showAllParcels(!oldVal);
  },
});

Template.Community_page.events({
  'click .js-partners'(event, instance) {
    const communityId = instance.viewmodel.communityId();
    Modal.show('Modal', {
      title: 'Teljes partner lista',
      body: 'Partners_table',
      bodyContext: { communityId },
      size: 'lg',
    });
  },
  'click .js-join'(event, instance) {
    const communityId = instance.viewmodel.communityId();
    const community = Communities.findOne(communityId);
    AccountsTemplates.forceLogin({ loginPage: 'signin' }, () => {
      Communities.actions.join({}, community).run(event, instance);
    });
  },
  ...(actionHandlers(Communities, 'delete')),
});
