/* globals document */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/kadira:flow-router';
/* globals Waypoint */

import { __ } from '/imports/localization/i18n.js';
import { displayMessage, onSuccess, handleError } from '/imports/ui_3/lib/errors.js';
import { Comments } from '/imports/api/comments/comments.js';
import { insert as insertComment, update as updateComment, remove as removeComment } from '/imports/api/comments/methods.js';
import { like } from '/imports/api/topics/likes.js';
import { Modal } from 'meteor/peppelg:bootstrap-3-modal';
import '/imports/ui_3/views/modals/confirmation.js';
import '/imports/ui_3/views/blocks/chopped.js';
import './comments-section.html';

Template.Comments_section.onCreated(function commentsSectionOnCreated() {
  this.autorun(() => {
    // not needed any more, we subscribe to all comments in main now
    // this.subscribe('comments.onTopic', { topicId: this.data._id });
  });
});

Template.Comments_section.onRendered(function chatboxOnRendered() {
  this.waypoint = new Waypoint({
    element: this.find('.comment-section'),
    handler() {
      const topicId = this.element.dataset.id;
      // displayMessage('info', `You just seen ${topicId}`); // debug
      Meteor.user().hasNowSeen(topicId);
    },
    offset: '80%',
  });
  // Above is nicer syntax , but requires bigu:jquery-waypoints https://stackoverflow.com/questions/28975693/using-jquery-waypoints-in-meteor
  /* this.waypoint = this.$('.comment-section').waypoint(function (direction) {
    displayMessage('info', `You just seen ${this.dataset.id}`); // debug
  }, {
    offset: '80%',
  });*/
});

Template.Comments_section.onDestroyed(function chatboxOnDestroyed() {
  this.waypoint.destroy();
});

Template.Comments_section.helpers({
  isVote() {
    const topic = this;
    return topic.category === 'vote';
  },
  comments() {
    return Comments.find({ topicId: this._id });
  },
  recentComments() {
    const latestComments = Comments.find({ topicId: this._id }, { sort: { createdAt: -1 } }).fetch();
    return latestComments.slice(0, 5).reverse(); 
  },
  fromBoard() {
    const route = FlowRouter.current().route.name; 
    if (route == 'Board') return true;
    return false;
  },
  showPrevious() {
    const comments = Comments.find({ topicId: this._id }).fetch();
    const button = `<div class="social-comment"><a class="text-muted" href="/topic/${this._id}">${__('View previous comments')}</a></div>`;
    if (comments.length > 5) return button;
    return;
  },
});

Template.Comments_section.events({
  'keydown .js-send-enter'(event) {
    const topicId = this._id;
    const userId = Meteor.userId();
    if (event.keyCode === 13 && !event.shiftKey) {
      const textarea = event.target;
      insertComment.call({ topicId, userId, text: textarea.value },
        onSuccess((res) => {
          textarea.value = '';
        })
      );
    }
  },
});

//------------------------------------

Template.Comment.helpers({
});

Template.Comment.events({
  'click .js-like'(event) {
    like.call({
      coll: 'comments',
      id: this._id,
    }, handleError);
  },
  'click .js-edit'(event, instance) {
    $('span[data-id="' + instance.data._id + '"]').toggleClass('hidden');
    const originalText = Comments.findOne({ _id: instance.data._id }).text;
    const textareaEdit = '<span id="editableSpan"><textarea class="form-control js-send-edited">' + 
      originalText + '</textarea>' + `<small class="text-muted">${__('commentEditInstruction')} </small></span>`;
    $(textareaEdit).insertAfter('span[data-id="' + instance.data._id + '"]');
    $('#editableSpan > textarea').focus();
  },
  'keydown .js-send-edited'(event, instance) {
    // pressing escape key
    if (event.keyCode === 27) { 
      event.preventDefault();
      $('#editableSpan').remove();
      $('span[data-id="' + instance.data._id + '"]').toggleClass('hidden');
    }
    // pressing enter key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const editedText = $('#editableSpan > textarea').val();
      updateComment.call({
        _id: instance.data._id,
        modifier: { $set: { text: editedText } },
      }, handleError);
      $('#editableSpan').remove();
      $('span[data-id="' + instance.data._id + '"]').toggleClass('hidden');
    }
  },
  'click .js-delete'(event, instance) {
    Modal.confirmAndCall(removeComment, { _id: this._id }, {
      action: 'delete comment',
      message: 'It will disappear forever',
    });
  },
});
