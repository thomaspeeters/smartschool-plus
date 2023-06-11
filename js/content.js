chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {

	if (message.target !== 'content') {
		return;
	}

	if (message.type === "make-album-zip") {
		if (message.data.photoData && message.data.albumId) {
			makeAlbumZip(message.data.albumId, message.data.photoData);
		}
	}
}

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
			album.append(
				$('<div></div>')
					.attr("id", "ss-plus-dl-album-panel-" + albumId)
					.addClass("ss-plus-dl-album-panel")
			);

			$("#ss-plus-dl-album-panel-" + albumId).append(
				$("<button />")
					.attr("id", "ss-plus-dl-album-btn-" + albumId)
					.addClass("ss-plus-btn ss-plus-dl-album-btn")
					.prepend('<i class="fa-solid fa-download"></i>')
					.append('<span>Download album zip</span>')
					.on("click", function () {
						dlAlbum(albumId);
					}),
				$('<span></span>')
					.attr('id', 'ss-plus-dl-album-progress-' + albumId)
					.addClass('ss-plus-dl-album-progress')
			);
		}
	});
}

function dlAlbum(albumId) {
	$('#ss-plus-dl-album-btn-' + albumId).prop("onclick", null).off("click").find('span').remove();
	$('#ss-plus-dl-album-btn-' + albumId).find('svg').attr('data-icon', 'circle-notch').addClass('fa-spin');
	$('#ss-plus-dl-album-progress-' + albumId).text("Gathering photos...");

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

function makeAlbumZip(albumId, photoData) {
	zip.configure({ chunkSize: 128, useWebWorkers: false });

	getZipFileBlob(photoData, albumId)
		.then(blob => downloadFile(blob, albumId));
}

async function getZipFileBlob(photoData, albumId) {
	const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	for (const photo of photoData) {
		$('#ss-plus-dl-album-progress-' + albumId).text('Adding photo ' + photo.filename);

		await zipWriter.add(photo.filename, new zip.HttpReader(photo.originalUrl));
	}

	return zipWriter.close();
}

function downloadFile(blob, albumId) {
	const albumTitle = $("#ss-plus-dl-album-panel-" + albumId).parent().find(".album_title").text();
	const filename = cleanFilename(albumTitle + '.zip');

	const dlLink = document.createElement("a");
	dlLink.setAttribute('href', URL.createObjectURL(blob));
	dlLink.setAttribute('download', filename);
	dlLink.innerText = 'Download ' + filename;

	$('#ss-plus-dl-album-panel-' + albumId).prepend(
		$('<a/>')
			.attr("href", URL.createObjectURL(blob))
			.attr("download", filename)
			.attr("id", "ss-plus-dl-album-zip-" + albumId)
			.addClass("ss-plus-btn ss-plus-dl-album-zip")
			.text(' Download ' + filename)
	);
	$("#ss-plus-dl-album-zip-" + albumId).prepend('<i class="fa-solid fa-download"></i>');
	$('#ss-plus-dl-album-progress-' + albumId).text(' Done').prepend('<i class="fa-solid fa-check"></i>');
	$('#ss-plus-dl-album-btn-' + albumId).find('svg').attr('data-icon', 'check').removeClass('fa-spin');
	$('#ss-plus-dl-album-btn-' + albumId).remove();
}

function cleanFilename(filename) {
	return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
}