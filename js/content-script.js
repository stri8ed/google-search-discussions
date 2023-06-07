'use strict';

const IN_URL = [
	'forum',
	'viewthread',
	'showthread',
	'viewtopic',
	'showtopic',
	`"index.php?topic"`
];
const IN_TEXT = [
	`"reading this topic"`,
	`"next thread"`,
	`"next topic"`,
	`"send private message"`
];

const MENU_CONTAINER = '[role="navigation"]';
const DISC_FILTER = ` inurl:${IN_URL.join('|')} | intext:${IN_TEXT.join('|')}`;

let observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if(mutation.addedNodes.length){
        let nodes = Array.from(mutation.addedNodes);
        nodes.some(function(node){
            if(node.querySelector && node.querySelector(MENU_CONTAINER) && node.clientHeight > 0) {
                getMenuContainer().then(addMenuItem);
                return true;
            }
        });
    }
  });    
});

(function init() {
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    getMenuContainer().then(addMenuItem);
})();

function getMenuContainer() {
    return new Promise(function(res, rej) {
        let interval = setInterval(function() {
            const navigations = document.querySelectorAll(MENU_CONTAINER);
            const arr = Array.from(navigations);
            const elm = arr.find(elm => elm.clientHeight > 0 && elm.innerHTML.includes('href='));
            if(elm){
                clearInterval(interval);
                res(elm);
            }
        }, 10);
    });
}

function addMenuItem(menu){
    let enabled = false;
    const isActive = discussionActive();
    const href = document.location.origin + '/search?q=' + getQuery() + DISC_FILTER;
    const button = menu?.querySelector('a')?.cloneNode();
    if(!button) {
        return;
    }
    button.setAttribute("id", "discuss-btn")
    let name = 'Discussions ';
    let goTo = (e) => {
        e.preventDefault();
        document.location.href = href; 
        return false;
    };
    if(enabled) {
        goTo = (e) => e.preventDefault();
    }
    button.addEventListener('click', goTo, true);
    let buttonContent = `<span>${name}</span>`;
    let cancelButton = Object.assign(document.createElement('a'), {
        className: 'cancel-discussions',
        title: "Cancel",
        innerHTML: '<span style="color: red; margin-left: 5px;">🗙</span>',
        onclick: (e) => {
            e.preventDefault();
            document.location.href = getNormalizedGoogleUrl();
            return false;
        }
    })
    button.innerHTML = buttonContent;
    if(isActive) {
        button.appendChild(cancelButton);
    }
    if(!menu.querySelector('#discuss-btn')){
        const children = menu.querySelectorAll('a');
        const first = children[0];
        first.parentNode.insertBefore(button, first);
    }  
}

/**
 * Detect if disucssions filter is currently active.
 */
function discussionActive() {
    let regex = /[^a-z=]/g;
    let href = document.location.href.replace(regex, '');
    let filter = DISC_FILTER.replace(regex, '');
    return href.lastIndexOf(filter) > href.lastIndexOf('q=');
}

/**
 * Strip current Google search query of any discussions filter.
 * @returns {string}
 */
function getNormalizedGoogleUrl() {
    const filter = DISC_FILTER.match(/\S+?\|/)[0];
    let query = decodeURI(getQuery()).replace(new RegExp( '[ +]?' + filter.replace('|', '\\|') + '.+' ), '');
    return document.location.origin + '/search?q=' + query;
}

/**
 * Get current Google search query.
 */
function getQuery(){
    let regex = /(?:[&?#])q=([^&#]+)/g,
        url = document.location.href,
        match, 
        query;
    while((match = regex.exec(url))) {
        query = match;
    }
    return query && query[1];
}