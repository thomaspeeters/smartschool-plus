$(function() {
    let searchParams = new URLSearchParams(window.location.search);
	let photoId = searchParams.get('photo');
		
	addDlOrigLink(photoId);
});

function addDlOrigLink(photoId) {
	let filename = ($('.photo_title').length > 0 ? $('.photo_title').contents().not($('.photo_title').children()).text() : photoId + ".jpg");

	$(".photo").after(
		$("<a/>")
			.attr("href", window.location.origin + "/index.php?module=Photos&file=load_photo&function=load_photo&obj_type=photo&img_type=original&id=" + photoId)
			.attr("download", filename)
			.attr("id", "ss-plus-dl-orig-" + photoId)
			.addClass("ss-plus-dl-orig")
			.text(' Download original')
	);
  
  	$("#ss-plus-dl-orig-" + photoId).prepend('<i class="fa-solid fa-download"></i>');
}