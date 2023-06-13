const OFFSCREEN_DOCUMENT_PATH = '/dl-album.html';
let creating; // A global promise to avoid concurrency issues

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
    console.log(message);

    if (message.target !== 'service-worker') {
        return;
    }

    if (message.type === "dl-album") {
        if (message.data.albumId && message.data.origin) {
            sendMessageToOffscreenDocument("dl-album-count-pages", {
                albumId: message.data.albumId,
                origin: message.data.origin
            });
        }
    }

    if (message.type === "dl-album-count-pages") {
        if (message.data.numberOfPages && message.data.origin) {
            sendMessageToOffscreenDocument("dl-album-get-photodata", {
                albumId: message.data.albumId,
                numberOfPages: message.data.numberOfPages,
                origin: message.data.origin
            });
        }
    }

    if (message.type === "dl-album-get-photodata") {
        if (message.data.photoData && message.data.albumId) {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            chrome.tabs.sendMessage(tab.id, {
                target: 'content',
                type: 'make-album-zip',
                data: {
                    albumId: message.data.albumId,
                    photoData: message.data.photoData
                }
            });
        }

        closeOffscreenDocument();
    }
}

async function sendMessageToOffscreenDocument(type, data) {
    // Create an offscreen document if one doesn't exist yet
    if (!(await hasDocument())) {
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'Parse DOM'
        });
    }
    // Now that we have an offscreen document, we can dispatch the
    // message.
    chrome.runtime.sendMessage({
        target: 'offscreen',
        type,
        data
    });
}

async function setupOffscreenDocument(path) {
    // Check all windows controlled by the service worker to see if one 
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path);
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url === offscreenUrl) {
            return;
        }
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.DOM_PARSER],
            justification: 'Parse DOM',
        });
        await creating;
        creating = null;
    }
}

async function hasDocument() {
    // Check all windows controlled by the service worker if one of them is the offscreen document
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
            return true;
        }
    }
    return false;
}

async function closeOffscreenDocument() {
    if (!(await hasDocument())) {
        return;
    }
    await chrome.offscreen.closeDocument();
}
