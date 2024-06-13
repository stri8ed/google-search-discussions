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

const FORUM_PARAM = "udm=18"
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

function getMode() {
    return chrome.storage.sync.get({mode: 'filter'});
}

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
    if(menu.querySelector(`#${BUTTON_ID}`)) {
        return;
    }
    getMode().then(mode => {
        if(mode.mode === 'filter') {
            addDiscussionsMenuItem(menu);
        } else {
            addForumMenuItem(menu);
        }
    })

}

function addButtonToMenu(menu, label, href){
    const list = menu?.querySelector('[role="list"]');
    if(!list) {
        return;
    }
    const listItems = Array.from(list.querySelectorAll(':scope > div'))
    const prevButton = listItems[listItems.length - 2]
    const button = document.createElement("div");
    button.setAttribute("id", BUTTON_ID);
    const goTo = (e) => {
        e.preventDefault();
        if(href) {
            document.location.href = href;
        }
        return false;
    };
    button.addEventListener('click', goTo, true);
    button.innerHTML = `<a href="" class="${prevButton.firstChild.className}">
        <div class="${prevButton.firstChild.firstChild.className}">${label}</div>
    </a>`;
    list.insertBefore(button, list.lastChild);
    return button;
}

function addForumMenuItem(menu){
    const isActive = document.location.href.includes(FORUM_PARAM);
    if(isActive) {
        return;
    }
    const selector = `a[href*="${FORUM_PARAM}"]`;
    const existingButton = menu.querySelector(selector);
    if(existingButton && !existingButton.closest('[aria-haspopup="true"]')) {
        return;
    }
    const href = document.location.origin + '/search?q=' + getQuery() + '&' + FORUM_PARAM;
    addButtonToMenu(menu, 'Forums', href);
}

function addDiscussionsMenuItem(menu){
    const isActive = discussionActive();
    const href = !isActive ? (document.location.origin + '/search?q=' + getQuery() + DISC_FILTER) : '';
    const button = addButtonToMenu(menu, 'Discussions', href);
    let cancelButton = Object.assign(document.createElement('a'), {
        className: 'cancel-discussions',
        title: "Cancel",
        innerHTML: '<span style="color: #bd0000; vertical-align: middle; display: inline-block; cursor: pointer;">✖</span>',
        onclick: (e) => {
            e.preventDefault();
            document.location.href = getNormalizedGoogleUrl();
            return false;
        }
    })
    if(isActive) {
        button.appendChild(cancelButton);
    }
    normalizeFilterUrls(menu);
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