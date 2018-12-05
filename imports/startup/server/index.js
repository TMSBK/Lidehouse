// Initial db data
import '/imports/api/permissions/config.js';
import '/imports/api/shareddocs/sharedfolders/builtin.js';

// This defines a starting set of data to be loaded if the app is loaded with an empty db.
import './live-fixtures.js';

// This file configures the Accounts package to define the UI of the enrollment / verification / reset password email.
import './accounts-email-config.js';
import './accounts-verification.js';

import './notifications.js';
import './email-sender.js';

// Set up some rate limiting and other important security settings.
import './security.js';
import './browser-policy.js'

// This contains registered jobs to be executed in the future
import '/imports/api/jobs-timers.js';

// This defines all the collections, publications and methods that the application provides
// as an API to the client.
import './register-api.js';

// This file configures every function, what needs timing
import './time-machine.js'

