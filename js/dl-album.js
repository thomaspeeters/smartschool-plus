chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {

    // chrome.runtime.sendMessage({
    //     target: 'service-worker',
    //     type: 'debug',
    //     data: {
    //         msg: message
    //     }
    // });


    // Return early if this message isn't meant for the offscreen document.
    if (message.target !== 'offscreen') {
        return false;
    }

    if (message.type === "dl-album-count-pages") {
        if (message.data.albumId && message.data.origin) {
            let numberOfPages = await countPages(message.data.albumId, message.data.origin);

            chrome.runtime.sendMessage({
                target: 'service-worker',
                type: 'dl-album-count-pages',
                data: {
                    albumId: message.data.albumId,
                    numberOfPages: numberOfPages,
                    origin: message.data.origin
                }
            });
        }
    }

    if (message.type === "dl-album-get-photodata") {
        if (message.data.albumId && message.data.numberOfPages && message.data.origin) {
            let photoData = await getPhotoData(message.data.albumId, message.data.numberOfPages, message.data.origin);

            chrome.runtime.sendMessage({
                target: 'service-worker',
                type: 'dl-album-get-photodata',
                data: {
                    photoData: photoData
                }
            });
        }
    }
}

async function countPages(albumId, albumOrigin) {

    const html = await processUrl(albumOrigin + "/index.php?module=Photos&file=album&function=show_album&album=" + albumId);

    var parser = new DOMParser();
    var doc = parser.parseFromString(html.text, 'text/html');

    // Divide by two, because the paging controls appear twice on the page
    var numberOfPages = doc.querySelectorAll('.page_nav a').length / 2;

    return numberOfPages;
}

async function getPhotoData(albumId, numberOfPages, photoOrigin) {
    var urls = [];

    for (let i = 1; i <= numberOfPages; i++) {
        urls.push(photoOrigin + "/index.php?module=Photos&file=album&function=show_album&album=" + albumId + "&page=" + i);
    }

    const results = await Promise.all(urls.map(processUrl));
    var photoData = [];

    for (let index = 0; index < results.length; index++) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(results[index].text, 'text/html');

        let photoUrls = [...doc.querySelectorAll('.thumb_img a')].map(photoAnchor => photoOrigin + photoAnchor.getAttribute('href'));

        photoData = photoData.concat(await processPhotoUrls(photoUrls, photoOrigin));
    }

    return photoData;
}

async function processPhotoUrls(photoUrls, photoOrigin) {
    const photoUrlData = [];
    const photoPages = await Promise.all(photoUrls.map(processUrl));

    for (let indexPhoto = 0; indexPhoto < photoPages.length; indexPhoto++) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(photoPages[indexPhoto].text, 'text/html');

        let photoFilename = doc.querySelector('.photo_title').childNodes[0].nodeValue;
        let photoParams = new URLSearchParams(photoPages[indexPhoto].url);
        let photoId = photoParams.get('photo');

        let photoOriginalUrl = photoOrigin + "/index.php?module=Photos&file=load_photo&function=load_photo&obj_type=photo&img_type=original&id=" + photoId

        photoUrlData.push({
            filename: photoFilename,
            originalUrl: photoOriginalUrl
        });
    }

    return photoUrlData;
}

async function processUrl(url) {
    try {
        const text = await (await fetch(url)).text();
        return { url, text };
    } catch (error) {
        return { url, error };
    }
}