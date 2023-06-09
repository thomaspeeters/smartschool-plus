
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		console.log(request);
	}
);

/*
chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
console.log('test in');

console.log(message);
    if (message.target !== 'content') {
        return false;
    }

	
}
*/

$(function () {
	let searchParams = new URLSearchParams(window.location.search);

	let paramPhotoId = searchParams.get('photo');
	let paramCategoryId = searchParams.get('cat');
	let paramFile = searchParams.get('file');
	let paramFunction = searchParams.get('function');
	let paramModule = searchParams.get('module');

	if (paramModule
		&& paramFile
		&& paramFunction
		&& paramPhotoId
		&& "photos" == paramModule.toLocaleLowerCase()
		&& "photo" == paramFile.toLocaleLowerCase()
		&& "show_photo" == paramFunction.toLocaleLowerCase()) {
		addDlOrigLink(paramPhotoId);
	}

	if (paramModule
		&& paramFunction
		&& paramCategoryId
		&& "photos" == paramModule.toLocaleLowerCase()
		&& "main" == paramFunction.toLocaleLowerCase()) {
		initAlbums();
	}
});

function addDlOrigLink(photoId) {
	let filename = ($('.photo_title').length > 0 ? $('.photo_title').contents().not($('.photo_title').children()).text() : photoId + ".jpg");

	$(".photo").after(
		$("<a/>")
			.attr("href", window.location.origin + "/index.php?module=Photos&file=load_photo&function=load_photo&obj_type=photo&img_type=original&id=" + photoId)
			.attr("download", filename)
			.attr("id", "ss-plus-dl-orig-" + photoId)
			.addClass("ss-plus-btn ss-plus-dl-orig")
			.text(' Download original')
	);

	$("#ss-plus-dl-orig-" + photoId).prepend('<i class="fa-solid fa-download"></i>');
}

function initAlbums() {
	$('.album_row').each(function () {
		let album = $(this);

		let albumUrl = album.find('.album_img a').attr('href');

		let albumParams = new URLSearchParams(albumUrl);
		let albumId = albumParams.get("album");

		if (albumId) {
			album.find('.album_title').append(
				$("<button />")
					.attr("id", "ss-plus-dl-album-" + albumId)
					.addClass("ss-plus-btn ss-plus-dl-album")
					.text(" Download album zip")
					.prepend('<i class="fa-solid fa-download"></i>')
					.on("click", function () {
						dlAlbum(albumId);
					})
			);
		}
	});
}

function dlAlbum(albumId) {
	(async () => {
		const response = await chrome.runtime.sendMessage({
			type: "dl-album",
			target: "service-worker",
			data: { 
				albumId: albumId,
				origin: window.location.origin
			}
		});
	})();
}