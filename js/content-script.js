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
const BUTTON_ID = 'discuss-btn';

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
    const isActive = discussionActive();
    const href = document.location.origin + '/search?q=' + getQuery() + DISC_FILTER;
    const list = menu?.querySelector('[role="list"]');
    if(!list) {
        return;
    }
    const button = list.lastChild.previousSibling.cloneNode(true);
    button.setAttribute("id", BUTTON_ID);
    let name = 'Discussions ';
    let goTo = (e) => {
        e.preventDefault();
        document.location.href = href; 
        return false;
    };
    if(isActive) {
        goTo = (e) => e.preventDefault();
    }
    button.addEventListener('click', goTo, true);
    let buttonContent = `<a class="${button.firstChild.className}"><div class="${button.firstChild.firstChild.className}">${name}</div></a>`;
    let cancelButton = Object.assign(document.createElement('a'), {
        className: 'cancel-discussions',
        title: "Cancel",
        innerHTML: '<span style="color: #bd0000; vertical-align: middle; display: inline-block; ">✖</span>',
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
    if(!menu.querySelector(`#${BUTTON_ID}`)){
        list.insertBefore(button, list.lastChild);
        normalizeFilterUrls(menu);
    }  
}

/**
 * Remove filters from other menu items.
 */
function normalizeFilterUrls(menu) {
    Array.from(menu.querySelectorAll('a'))
        .forEach(a => {
            if(a.id !== BUTTON_ID) {
                const tbm = a.href.includes('tbm=') ? a.href.match(/tbm=[^&]+/)[0] : '';
                a.href = getNormalizedGoogleUrl() + '&' + tbm;
            }
        })
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