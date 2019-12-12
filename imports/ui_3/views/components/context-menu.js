import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';

import './context-menu.html';

export class ContextMenu {
  constructor(instance, contextObject, collection) {
    contextObject.visible = false;
    this.instance = instance;
    this.contextObject = contextObject;
    instance[contextObject.template] = new ReactiveVar(contextObject);
    
    Template.ContextMenu.helpers({
      contextMenu_ctx(template) {
        const reactiveVar = instance[template].get();
        if (reactiveVar.id) reactiveVar.doc = collection.findOne(reactiveVar.id);
        return reactiveVar;
      },
    });

    Template.ContextMenu.events({
      'click .context-menu'() {
        contextObject.visible = false;
        instance[contextObject.template].set(contextObject);
      },
      'mouseleave .context-menu'() {
        contextObject.visible = false;
        instance[contextObject.template].set(contextObject);
      },
    });
  }
  show(event, id) {
    if (id) this.contextObject.id = id;
    this.contextObject.visible = true;
    this.instance[this.contextObject.template].set(this.contextObject);
    if (event.screenX > window.innerWidth/2) {
      $('.context-menu').offset({ left: event.pageX + 10, top: event.pageY - 10 });
      Meteor.defer(function () { $('.context-menu').children(':first').removeClass('pull-left'); });
      Meteor.defer(function () { $('.context-menu').children(':first').addClass('pull-right'); });
    } else {
      $('.context-menu').offset({ left: event.pageX - 10, top: event.pageY - 10 });
      Meteor.defer(function () { $('.context-menu').children(':first').removeClass('pull-right'); });
      Meteor.defer(function () { $('.context-menu').children(':first').addClass('pull-left'); });
    }
  }
}

