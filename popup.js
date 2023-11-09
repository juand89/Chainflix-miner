chrome.runtime.sendMessage({
    action: "userClick"
});
document.getElementById("openChainflix").addEventListener('click', () => {
    chrome.tabs.create({
        url: 'https://www.chainflix.net'
    })
})