const platformDimensions = {
  general: {
    '': { width: 256, height: 256, borderRadius: 128 }
  },
  discord: {
    'profile': { width: 80, height: 80, borderRadius: 40 },
    'message': { width: 48, height: 48, borderRadius: 24 },
    'dm': { width: 32, height: 32, borderRadius: 16 },
  },
  twitter: {
    'profile': { width: 133.5, height: 133.5, borderRadius: 66.75 },
    'preview': { width: 64, height: 64, borderRadius: 32 },
    'post': { width: 40, height: 40, borderRadius: 20 },
  },
  bsky: {
    profile: { width: 90, height: 90, borderRadius: 45 },
    post: { width: 42, height: 42, borderRadius: 21 },
  },
  steam: {
    'profile page': { width: 184, height: 184, borderRadius: 0 },
    '64x64': { width: 64, height: 64, borderRadius: 0 },
    'friend list': { width: 30, height: 30, borderRadius: 0 },
    'topright': { width: 22, height: 22, borderRadius: 0 },
  },
  artfight: {
    thumbnail: { width: 200, height: 200, borderRadius: 5 },
    profile: { width: 100, height: 100, borderRadius: 5 },
    featured: { width: 70, height: 70, borderRadius: 5 },
    'navvar icon': { width: 51, height: 51, borderRadius: 0 },
  },
  youtube: {
    channel: { width: 160, height: 160, borderRadius: 80 },
    'top right': { width: 32, height: 32, borderRadius: 16 },
  },
  spotify: {
    'playlist thumbnail': { width: 232, height: 232, borderRadius: 4 },
    profile: { width: 32.28, height: 32.28, borderRadius: 16.14 }
  }
};

// Function to generate the options dynamically
function generatePlatformOptions() {
  const platformSelect = document.getElementById('platform-select');

  // Loop through each platform in the platformDimensions object
  for (const platform in platformDimensions) {
    if (platformDimensions.hasOwnProperty(platform)) {
      // Create a new option element
      const option = document.createElement('option');
      option.value = platform;
      option.textContent = platform;

      // Append the option to the select element
      platformSelect.appendChild(option);
    }
  }
}

// Call the function to generate the options when the page loads
generatePlatformOptions();

document.addEventListener('DOMContentLoaded', function () {
  const inputImage = document.getElementById('inputImage');
  const image = document.getElementById('cropperimage');
  const saveButton = document.getElementById('saveButton');
  let cropper;

  // init cropperjs
  function initializeCropper() {
    if (cropper) {
      cropper.destroy();
    }
    cropper = new Cropper(image, {
      aspectRatio: 1 / 1,
      viewMode: 1,
      dragMode: 'move',
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      preview: '.cropperpreview',
      background: false,
      zoomOnWheel: false,
      rotatable: true,
    });

    // Show the image after Cropper is initialized
    image.style.display = 'block';
  }

  // Handle image upload
  inputImage.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        image.src = event.target.result;
        image.style.display = 'none'; // Hide the image before initializing Cropper
        initializeCropper(); // Initialize Cropper after loading the image
        saveButton.style.display = 'block'; // Show the save button
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle platform change
  document.getElementById('platform-select').addEventListener('change', function () {
    const selectedPlatform = this.value;
    const previewsContainer = document.getElementById('previews');
    const platformNameElement = document.getElementById('platformName');

    // Update the platform name
    platformNameElement.textContent = selectedPlatform;

    // Get the dimensions for the selected platform
    const platformPreviews = platformDimensions[selectedPlatform];
    const previewEntries = Object.entries(platformPreviews);

    // Clear existing previews
    previewsContainer.innerHTML = '';

    // Loop through the required number of previews for the selected platform
    previewEntries.forEach(([previewName, dimensions], index) => {
      // Create the wrapper div
      const ultimatePreviewer = document.createElement('div');
      ultimatePreviewer.classList.add('ultimate-previewer');

      // Create the <p> element for the setting name
      const settingName = document.createElement('p');
      settingName.textContent = previewName;
      ultimatePreviewer.appendChild(settingName);

      // Create the preview div
      const previewDiv = document.createElement('div');
      previewDiv.classList.add('cropperpreview', `preview-${index + 1}`);
      previewDiv.style.width = `${dimensions.width}px`;
      previewDiv.style.height = `${dimensions.height}px`;
      previewDiv.style.borderRadius = `${dimensions.borderRadius}px`;
      previewDiv.style.overflow = 'hidden';
      ultimatePreviewer.appendChild(previewDiv);

      // Add the wrapper div to the previews container
      previewsContainer.appendChild(ultimatePreviewer);
    });

    // Reinitialize Cropper.js to attach to the new preview elements
    if (image.src) {
      image.style.display = 'none'; // Hide the image before reinitializing Cropper
      initializeCropper();
    }
  });

  // Save the cropped image when the button is clicked
  saveButton.addEventListener('click', function () {
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        // Convert the canvas to a data URL
        const croppedImageURL = croppedCanvas.toDataURL('image/png');

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = croppedImageURL;
        const originalFileName = inputImage.files[0].name;
        const fileNameParts = originalFileName.split('.');
        const fileNameWithoutExtension = fileNameParts.slice(0, -1).join('.');
        link.download = `cool_pfp_${fileNameWithoutExtension}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  });

  // Trigger the change event on page load to set the initial state
  document.getElementById('platform-select').dispatchEvent(new Event('change'));
});