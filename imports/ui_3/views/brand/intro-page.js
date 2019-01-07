/* globals window WOW */
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import '/imports/api/demohouse.js';
import './intro-page.html';


Template.Intro_page.onRendered(function(){

    $('body').addClass('landing-page');
    $('body').removeClass('fixed-nav').removeClass('fixed-nav-basic');  // added by the main navbar
    $('body').attr('id', 'page-top');
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 80
    });

    // Page scrolling feature
    $('a.page-scroll').bind('click', function(event) {
        var link = $(this);
        $('html, body').stop().animate({
            scrollTop: $(link.attr('href')).offset().top - 50
        }, 500);
        event.preventDefault();
        $("#navbar").collapse('hide');
    });

    var cbpAnimatedHeader = (function() {
        var docElem = document.documentElement,
            header = document.querySelector( '.navbar-default' ),
            didScroll = false,
            changeHeaderOn = 200;
        function init() {
            window.addEventListener( 'scroll', function( event ) {
                if( !didScroll ) {
                    didScroll = true;
                    setTimeout( scrollPage, 250 );
                }
            }, false );
        }
        function scrollPage() {
            var sy = scrollY();
            if ( sy >= changeHeaderOn ) {
                $(header).addClass('navbar-scroll')
            }
            else {
                $(header).removeClass('navbar-scroll')
            }
            didScroll = false;
        }
        function scrollY() {
            return window.pageYOffset || docElem.scrollTop;
        }
        init();

    })();

    // Activate WOW.js plugin for animation on scroll
    new WOW({ offset: 50 }).init();

});

Template.Intro_page.onDestroyed(function() {
    $('body').removeClass('landing-page');
});

Template.Intro_page.events({
  'click .read-more'(event) {
    event.preventDefault();
    $(event.target).closest('div').find('.more-text').show();
    $(event.target).closest('p').hide();
  },
});
