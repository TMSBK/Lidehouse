import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import './context-menu.html';

export class ContextMenu {
  constructor(parentInstance, contextObject, element) {
    contextObject.visible = false;
    this.parentInstance = parentInstance;
    this.contextObject = contextObject;
    parentInstance[contextObject.template] = new ReactiveVar(contextObject);

    Template.ContextMenu.helpers({
      contextMenu_ctx(template) {
        const reactiveVar = parentInstance[template].get();
        const collection = Mongo.Collection.get(reactiveVar.collection);
        if (reactiveVar.id) reactiveVar.doc = collection.findOne(reactiveVar.id);
        return reactiveVar;
      },
    });

    Template.ContextMenu.events({
      [`click #${contextObject.template}`]() {
        contextObject.visible = false;
        parentInstance[contextObject.template].set(contextObject);
      },
      [`mouseleave #${contextObject.template}`]() {
        contextObject.visible = false;
        parentInstance[contextObject.template].set(contextObject);
      },
    });
  }
  show(event, id) {
    if (id) this.contextObject.id = id;
    this.contextObject.visible = true;
    this.parentInstance[this.contextObject.template].set(this.contextObject);
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

