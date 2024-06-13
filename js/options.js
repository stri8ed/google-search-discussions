
document.addEventListener('DOMContentLoaded', function() {
    getMode('filter');
});

document.getElementById('save').addEventListener('click', function() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    chrome.storage.sync.set({mode: selectedMode}, showSuccess);
});

function getMode(defaultMode) {
    chrome.storage.sync.get({mode: defaultMode}, function(data) {
        document.getElementById(data.mode).checked = true;
    });
}

function showSuccess() {
    const button = document.getElementById('save');
    const success = document.createElement('div');
    success.textContent = 'Options saved.';
    success.style.color = 'green';
    success.style.marginTop = '10px';
    button.parentElement.insertAdjacentElement('afterend', success);
    setTimeout(() => {
        success.remove();
    }, 1500);
}