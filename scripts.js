$(document).ready(function ($) {
	var dragging = false,
		scrolling = false,
		resizing = false;

	// Initial check for the visibility of image containers
	var imageComparisonContainers = $('.cd-image-container');
	checkPosition(imageComparisonContainers);

	// Check image container visibility on scroll
	$(window).on('scroll', function () {
		if (!scrolling) {
			scrolling = true;
			!window.requestAnimationFrame
				? setTimeout(function () {
						checkPosition(imageComparisonContainers);
				  }, 100)
				: requestAnimationFrame(function () {
						checkPosition(imageComparisonContainers);
				  });
		}
	});

	// Initialize drag functionality for each image container
	imageComparisonContainers.each(function () {
		var actual = $(this);
		drags(
			actual.find('.cd-handle'),
			actual.find('.cd-resize-img'),
			actual,
			actual.find('.cd-image-label[data-type="original"]'),
			actual.find('.cd-image-label[data-type="modified"]')
		);
	});

	// Check label visibility on window resize
	$(window).on('resize', function () {
		if (!resizing) {
			resizing = true;
			!window.requestAnimationFrame
				? setTimeout(function () {
						checkLabel(imageComparisonContainers);
				  }, 100)
				: requestAnimationFrame(function () {
						checkLabel(imageComparisonContainers);
				  });
		}
	});

	// Handle file upload and compression
	$('#uploadForm input[type="file"]').on('change', function (e) {
		compressAndUpload(e);
	});

	// Compress and upload the selected image file
	function compressAndUpload(e) {
		var fileInput = e.target;
		if (fileInput.files.length > 0) {
			var file = fileInput.files[0];

			var options = {
				file: file,
				quality: 1.0,
				mimeType: 'image/jpeg',
				maxWidth: 2000,
				maxHeight: 2000,
				width: 1000,
				height: 1000,
				minWidth: 500,
				minHeight: 500,
				convertSize: Infinity,
				loose: true,
				redressOrientation: true,
				beforeCompress: function (result) {
					console.log('Image size before compression:', result.size);
					console.log('mime type:', result.type);
				},
				success: function (result) {
					console.log('Compressed image size:', result.size);
					console.log('Compressed image mime type:', result.type);

					// Update file size information
					$('#originalSize').text(
						'Original: ' + formatFileSize(file.size)
					);
					$('#compressedSize').text(
						'Compressed: ' + formatFileSize(result.size)
					);
					$('#compressionDrop').html(
						'Size Drop: ' +
							'<i class="fas fa-arrow-down"></i>' +
							' ' +
							calculateCompressionDrop(file.size, result.size)
					);

					// Display the compressed image in the specified <img> tag
					var compressedImageURL = URL.createObjectURL(result);
					$('.cd-image-container img').attr(
						'src',
						compressedImageURL
					);
				},
				error: function (msg) {
					console.error(msg);
				},
			};

			new ImageCompressor(options);
		}
	}

	// Utility functions
	function formatFileSize(size) {
		const units = ['Bytes', 'KB', 'MB', 'GB'];
		let i = 0;
		while (size >= 1024 && i < units.length - 1) {
			size /= 1024;
			i++;
		}
		return size.toFixed(2) + ' ' + units[i];
	}

	function calculateCompressionDrop(originalSize, compressedSize) {
		const dropPercentage =
			((originalSize - compressedSize) / originalSize) * 100;
		return dropPercentage.toFixed(2) + '%';
	}

	// Check the visibility of image containers based on scroll position
	function checkPosition(container) {
		container.each(function () {
			var actualContainer = $(this);
			if (
				$(window).scrollTop() + $(window).height() * 0.5 >
				actualContainer.offset().top
			) {
				actualContainer.addClass('is-visible');
			}
		});

		scrolling = false;
	}

	// Check and update label visibility based on container size after resize
	function checkLabel(container) {
		container.each(function () {
			var actual = $(this);
			updateLabel(
				actual.find('.cd-image-label[data-type="modified"]'),
				actual.find('.cd-resize-img'),
				'left'
			);
			updateLabel(
				actual.find('.cd-image-label[data-type="original"]'),
				actual.find('.cd-resize-img'),
				'right'
			);
		});

		resizing = false;
	}

	// Initialize drag functionality for handle and resize elements
	function drags(
		dragElement,
		resizeElement,
		container,
		labelContainer,
		labelResizeElement
	) {
		dragElement
			.on('mousedown vmousedown', function (e) {
				dragElement.addClass('draggable');
				resizeElement.addClass('resizable');

				var dragWidth = dragElement.outerWidth(),
					xPosition = dragElement.offset().left + dragWidth - e.pageX,
					containerOffset = container.offset().left,
					containerWidth = container.outerWidth(),
					minLeft = containerOffset,
					maxLeft = containerOffset + containerWidth;

				dragElement
					.parents()
					.on('mousemove vmousemove', function (e) {
						if (!dragging) {
							dragging = true;
							!window.requestAnimationFrame
								? setTimeout(function () {
										animateDraggedHandle(
											e,
											xPosition,
											dragWidth,
											minLeft,
											maxLeft,
											containerOffset,
											containerWidth,
											resizeElement,
											labelContainer,
											labelResizeElement
										);
								  }, 100)
								: requestAnimationFrame(function () {
										animateDraggedHandle(
											e,
											xPosition,
											dragWidth,
											minLeft,
											maxLeft,
											containerOffset,
											containerWidth,
											resizeElement,
											labelContainer,
											labelResizeElement
										);
								  });
						}
					})
					.on('mouseup vmouseup', function (e) {
						dragElement.removeClass('draggable');
						resizeElement.removeClass('resizable');
					});
				e.preventDefault();
			})
			.on('mouseup vmouseup', function (e) {
				dragElement.removeClass('draggable');
				resizeElement.removeClass('resizable');
			});
	}

	// Animate the dragged handle during movement
	function animateDraggedHandle(
		e,
		xPosition,
		dragWidth,
		minLeft,
		maxLeft,
		containerOffset,
		containerWidth,
		resizeElement,
		labelContainer,
		labelResizeElement
	) {
		var leftValue = e.pageX + xPosition - dragWidth;
		if (leftValue < minLeft) {
			leftValue = minLeft;
		} else if (leftValue > maxLeft) {
			leftValue = maxLeft;
		}

		var widthValue =
			((leftValue + dragWidth / 2 - containerOffset) * 100) /
				containerWidth +
			'%';

		$('.draggable')
			.css('left', widthValue)
			.on('mouseup vmouseup', function () {
				$(this).removeClass('draggable');
				resizeElement.removeClass('resizable');
			});

		$('.resizable').css('width', widthValue);

		updateLabel(labelResizeElement, resizeElement, 'left');
		updateLabel(labelContainer, resizeElement, 'right');

		// Move the vertical line along with the drag handle
		$('.vertical-line').css('left', 'calc(' + widthValue + ' - 1px)');
		dragging = false;
	}

	// Update the visibility of labels based on their position relative to resize element
	function updateLabel(label, resizeElement, position) {
		if (position == 'left') {
			label.offset().left + label.outerWidth() <
			resizeElement.offset().left + resizeElement.outerWidth()
				? label.removeClass('is-hidden')
				: label.addClass('is-hidden');
		} else {
			label.offset().left >
			resizeElement.offset().left + resizeElement.outerWidth()
				? label.removeClass('is-hidden')
				: label.addClass('is-hidden');
		}
	}
});
