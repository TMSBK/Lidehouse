import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import './context-menu.html';

export class ContextMenu {
  constructor(contextObject, selector) {
    contextObject.visible = false;
    this.contextObject = contextObject;
    this.contextMenu = Blaze.renderWithData(Template.ContextMenu, contextObject, $(`#${selector}`)[0]);
    const self = this;

    Template.ContextMenu.viewmodel({
      self,
      contextMenu_ctx() {
        console.log(self);
        const reactiveVar = self.contextMenu.dataVar.get();
        const collection = Mongo.Collection.get(reactiveVar.collection);
        if (reactiveVar.id) reactiveVar.doc = collection.findOne(reactiveVar.id);
        return reactiveVar;
      },
    });

    Template.ContextMenu.events({
      [`click #${contextObject.template}`](event, instance) {
        contextObject.visible = false;
        this.contextMenu.dataVar.set(contextObject);
      },
      [`mouseleave #${contextObject.template}`](event, instance) {
        contextObject.visible = false;
        this.contextMenu.dataVar.set(contextObject);
      },
    });
  }
  show(event, id) {
    if (id) this.contextObject.id = id;
    this.contextObject.visible = true;
    this.contextMenu.dataVar.set(this.contextObject);
    if (event.screenX > window.innerWidth/2) {
      $(`#${this.contextObject.template}`).offset({ left: event.pageX + 10, top: event.pageY - 10 });
      Meteor.defer(function () { $('.context-menu').children(':first').removeClass('pull-left'); });
      Meteor.defer(function () { $('.context-menu').children(':first').addClass('pull-right'); });
    } else {
      $(`#${this.contextObject.template}`).offset({ left: event.pageX - 10, top: event.pageY - 10 });
      Meteor.defer(function () { $('.context-menu').children(':first').removeClass('pull-right'); });
      Meteor.defer(function () { $('.context-menu').children(':first').addClass('pull-left'); });
    }
  }
}

