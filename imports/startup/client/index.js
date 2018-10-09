/* eslint-disable import/imports-first */

import './comtype-language-extensions.js';
import './language.js';
import './routes.js';
import '/imports/ui_3/helpers';

import { Meteor } from 'meteor/meteor';
import { moment } from 'meteor/momentjs:moment';

function timeMachine(functionName, endDate, frequency='undefined') {
    try {
        const nowMS = moment().valueOf();
        const endDateMS = endDate.valueOf(); 
        const difference = endDateMS - nowMS;
        if (difference < 0 ) {
            throw 'The end date is in the past! What is pretty cool actually...';  
        } else if (frequency === 'undefined') {
            setTimeout(function(){ functionName(); }, difference);
        } else {
            let intervalId = setInterval(function(){ functionName(); }, frequency);
            function stopInterval(){ clearInterval(intervalId); };
            setTimeout(function(){ stopInterval(); }, difference);
        }
    } catch (error) {
        console.log('An error occured in the time machine! Check your flux condenser! ' + error)
    }
}

function calc() {
    console.log(5+5); 
}

timeMachine(calc,moment().add(6000, 'milliseconds'),1000);