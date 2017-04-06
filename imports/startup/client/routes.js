import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import to load these templates
import '../../ui/layouts/app-body.js';
import '../../ui/pages/root-redirector.js';
import '../../ui/pages/topics-show-page.js';
import '../../ui/pages/app-not-found.js';
import '../../ui/forms/communities-create-form.js';
import '../../ui/forms/users-show-form.js';

// Import to override accounts templates
import '../../ui/accounts/accounts-templates.js';

FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('App_body', { main: 'app_rootRedirector' });
  },
});

FlowRouter.route('/topics/:_id', {
  name: 'Topics.show',
  action() {
    BlazeLayout.render('App_body', { main: 'Topics_show_page' });
  },
});

FlowRouter.route('/create', {
  name: 'Communities.create',
  action() {
    BlazeLayout.render('App_body', { main: 'Communities_create_form' });
  },
});

FlowRouter.route('/user/:_id', {
  name: 'Users.show',
  action() {
    BlazeLayout.render('App_body', { main: 'Users_show_form' });
  },
});

// the App_notFound template is used for unknown routes and missing topics
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};
