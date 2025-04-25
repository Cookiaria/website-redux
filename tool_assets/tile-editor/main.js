// --- Global Variables ---
let canvas; // Fabric.js canvas instance
let currentSize = 256; // Initial canvas size
const objectControls = document.getElementById('objectControls');
const scaleRange = document.getElementById('scaleRange');
const scaleValue = document.getElementById('scaleValue');
const rotateRange = document.getElementById('rotateRange');
const rotateValue = document.getElementById('rotateValue');
const deleteBtn = document.getElementById('deleteBtn');
const cloneBtn = document.getElementById('cloneBtn');
const canvasSizeInput = document.getElementById('canvasSize');
const imageLoader = document.getElementById('imageLoader');
const textInput = document.getElementById('textInput');
const textColorInput = document.getElementById('textColor');
const addTextBtn = document.getElementById('addTextBtn');
const exportBtn = document.getElementById('exportBtn');
const selectedTextColorControl = document.getElementById('selectedTextColorControl');
const selectedTextColorInput = document.getElementById('selectedTextColor');
const textRotationInput = document.getElementById('textRotation');
const textRotationValue = document.getElementById('textRotationValue');
const tilePreview = document.getElementById('tilePreview');
const qualityToggleBtn = document.getElementById('qualityToggleBtn'); // Keep if still needed, otherwise remove
let isDragging = false; // Flag to track object dragging
let highQualityPreview = false; // Keep if still needed, otherwise remove
let previewUpdateTimeout; // Timeout ID for debouncing preview updates

// --- NEW: Updated updateTilePreview function ---

function updateTilePreview(immediate = false) {
    if (!canvas) return;
    clearTimeout(previewUpdateTimeout);

    const updateAction = () => {
        // Log ghost visibility before any changes
        console.log("Ghost visibility BEFORE update:", canvas.getObjects().filter(obj => obj._isGhostClone).map(obj => ({ id: obj.id, visible: obj.visible })));

        // Temporarily make all ghosts visible
        const ghosts = canvas.getObjects().filter(obj => obj._isGhostClone);
        ghosts.forEach(ghost => ghost.set('visible', true));

        // Render the canvas to a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentSize;
        tempCanvas.height = currentSize;
        const tempCtx = tempCanvas.getContext('2d');

        // Render all objects except background
        canvas.getObjects()
            .filter(obj => !obj._isBackground)
            .sort((a, b) => a._isGhostClone ? -1 : 1) // Ghosts first
            .forEach(obj => {
                obj.render(tempCtx);
            });

        // Update the preview
        tilePreview.style.setProperty('--tile-preview', `url(${tempCanvas.toDataURL()})`);
        tilePreview.style.setProperty('--tile-size', `${currentSize}px`);

        // Restore ghost visibility states
        ghosts.forEach(ghost => {
            if (!ghost._shouldBeVisible) {
                ghost.set('visible', false);
            }
        });

        // Log ghost visibility after restoring states
        console.log("Ghost visibility AFTER restoring states:", ghosts.map(obj => ({ id: obj.id, visible: obj.visible })));

        // Force a render to ensure canvas redraws with correct ghost visibility
        canvas.requestRenderAll();
    };

    if (immediate) {
        updateAction();
    } else {
        previewUpdateTimeout = setTimeout(updateAction, 100); // Adjust timeout as needed
    }
}

/**
 * Initializes the Fabric.js canvas.
 * Sets up dimensions, background, and attaches necessary event listeners.
 */
// --- NEW: Updated initCanvas function ---
function initCanvas() {
    // Ensure Fabric.js is loaded
    if (typeof fabric === 'undefined') {
        console.error("Fabric.js is not loaded yet.");
        return;
    }
    console.log("Fabric.js loaded, initializing canvas...");

    // Dispose of the old canvas instance if it exists (e.g., on size change)
    if (canvas) {
        canvas.dispose();
    }

    // Create the new Fabric.js canvas instance
    canvas = new fabric.Canvas('c', {
        width: currentSize,
        height: currentSize,
        backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent background for the canvas element itself
        preserveObjectStacking: true // Important for keeping ghosts behind originals
    });

    // Add white rectangle as background layer if needed (useful if exporting without transparency)
    // Comment this out if you want a truly transparent background for export
    const bgRect = new fabric.Rect({
        width: currentSize,
        height: currentSize,
        fill: 'rgba(0, 0, 0, 0)', // Set background color here
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        hoverCursor: 'default',
        _isBackground: true, // Custom flag to identify background
    });
    canvas.add(bgRect);
    canvas.sendToBack(bgRect); // Ensure it's behind everything

    // Setup event listeners for canvas and inputs
    setupCanvasListeners();
    setupInputListeners();

    // Initial render and updates
    updateAllClones(); // Create initial clones if any objects exist (usually none at init)
    updateTilePreview(true); // Update the preview immediately
    console.log(`Canvas initialized with size ${currentSize}x${currentSize}`);

    // Optional: Slight delay for final render check (sometimes helps with complex setups)
    setTimeout(() => {
        canvas.renderAll();
        updateTilePreview(true);
    }, 100);
}


/**
 * Sets up event listeners for the Fabric.js canvas.
 */
function setupCanvasListeners() {
    if (!canvas) return;
    canvas.off(); // Clear previous listeners to prevent duplicates

    // Listen for object selection events
    canvas.on({
        'selection:created': updateControls, // Show controls when object(s) selected
        'selection:updated': updateControls, // Update controls if selection changes
        'selection:cleared': hideControls,   // Hide controls when selection is cleared
    });

    // Listen for when an object is modified (scaled, rotated, finished dragging)
    canvas.on('object:modified', (e) => {
        if (e.target && !e.target._isBackground) {
            finalizeObjectPosition(e.target);
            updateAllClones();
            updateTilePreview(true); // Immediate update
        }
        updateControls(e);
    });32

    // Listen for continuous object moving (dragging)
    canvas.on('object:moving', handleObjectMoving);

    // Track dragging state
    canvas.on('mouse:down', (options) => {
        // Ignore clicks on the background rectangle
        if (options.target && !options.target._isBackground) isDragging = true; // Set flag when dragging starts
    });
    canvas.on('mouse:up', handleMouseUp); // Handle end of drag
}

/**
 * Finalizes an object's position by wrapping it around the canvas edges if its center moves off-canvas.
 * @param {fabric.Object} obj - The object to finalize.
 * @returns {boolean} - True if the object's position was changed, false otherwise.
 */
function finalizeObjectPosition(obj) {
    // Ignore if object is invalid, canvas isn't ready, it's a ghost clone, or the background
    if (!obj || !canvas || obj._isGhostClone || obj._isBackground) return false;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    let needsUpdate = false; // Flag to track if position changes
    let newLeft = obj.left;
    let newTop = obj.top;
    const center = obj.getCenterPoint(); // Get the object's center coordinates

    // Check horizontal wrapping based on center point
    if (center.x > canvasWidth) newLeft -= canvasWidth; // Wrap left
    else if (center.x < 0) new32Left += canvasWidth;      // Wrap right

    // Check vertical wrapping based on center point
    if (center.y > canvasHeight) newTop -= canvasHeight; // Wrap up
    else if (center.y < 0) newTop += canvasHeight;       // Wrap down

    // If position needs changing, apply it
    if (newLeft !== obj.left || newTop !== obj.top) {
        obj.set({ left: newLeft, top: newTop });
        obj.setCoords(); // Update object's coordinates after moving
        console.log("Finalized object position wrap for:", obj);
        needsUpdate = true;
    }
    return needsUpdate; // Indicate if a change occurred
    updateTilePreview(true);
}


/**
 * Sets up event listeners for HTML input elements (buttons, sliders, etc.).
 */
function setupInputListeners() {
    // Remove potential pre-existing listeners before adding new ones
    canvasSizeInput.removeEventListener('change', handleCanvasSizeChange);
    imageLoader.removeEventListener('change', handleImageLoad);
    addTextBtn.removeEventListener('click', addText);
    scaleRange.removeEventListener('input', handleScaleChange);
    rotateRange.removeEventListener('input', handleRotateChange);
    selectedTextColorInput.removeEventListener('input', handleSelectedTextColorChange);
    deleteBtn.removeEventListener('click', deleteSelectedObject);
    cloneBtn.removeEventListener('click', cloneSelectedObject);
    exportBtn.removeEventListener('click', exportPattern);
    textRotationInput.removeEventListener('input', updateTextRotationDisplay);
    window.removeEventListener('keydown', handleKeyDown); // Use window for keydown

    // Add listeners
    canvasSizeInput.addEventListener('change', handleCanvasSizeChange);
    imageLoader.addEventListener('change', handleImageLoad);
    addTextBtn.addEventListener('click', addText);
    scaleRange.addEventListener('input', handleScaleChange);
    rotateRange.addEventListener('input', handleRotateChange);
    selectedTextColorInput.addEventListener('input', handleSelectedTextColorChange);
    deleteBtn.addEventListener('click', deleteSelectedObject);
    cloneBtn.addEventListener('click', cloneSelectedObject);
    exportBtn.addEventListener('click', exportPattern);
    textRotationInput.addEventListener('input', updateTextRotationDisplay);
    window.addEventListener('keydown', handleKeyDown); // Listen globally for key presses
}

// Helper function for text rotation display update
function updateTextRotationDisplay() {
    textRotationValue.textContent = this.value + '°';
}


/**
 * Updates the control panel based on the currently selected object(s).
 * Shows/hides controls and sets their values.
 */
function updateControls(e) {
    const activeObject = canvas.getActiveObject();
    // Hide controls if no object, a ghost, or the background is selected
    if (!activeObject || activeObject._isGhostClone || activeObject._isBackground) {
        hideControls();
        return;
    }
    objectControls.classList.remove('hidden'); // Show the controls panel

    // Default values and flags
    let currentScale = 1;
    let currentAngle = 0;
    let currentFill = '#000000';
    let isText = false;
    let isGroup = activeObject.type === 'activeSelection'; // Check if multiple objects are selected

    // If it's a single object selection
    if (!isGroup) {
        currentScale = activeObject.scaleX || 1; // Use scaleX (assuming uniform scaling)
        currentAngle = activeObject.angle || 0;
        // Check if it's a text object
        if (activeObject.type === 'textbox' || activeObject.type === 'i-text') {
            isText = true;
            currentFill = activeObject.get('fill'); // Get text color
        }
    }

    // Disable scale/rotate/color controls for multi-selections (groups)
    scaleRange.disabled = isGroup;
    rotateRange.disabled = isGroup;
    selectedTextColorControl.classList.toggle('hidden', !isText || isGroup); // Show color only for single text objects

    // Update control values if it's a single selection
    if (!isGroup) {
        scaleRange.value = currentScale;
        scaleValue.textContent = parseFloat(currentScale).toFixed(2);
        rotateRange.value = currentAngle;
        rotateValue.textContent = `${Math.round(currentAngle)}°`;
        if (isText) {
            selectedTextColorInput.value = currentFill;
        }
    } else {
        // Show placeholder text for groups
        scaleValue.textContent = '---';
        rotateValue.textContent = '---';
    }
}

/**
 * Hides the selected object control panel.
 */
function hideControls() {
    objectControls.classList.add('hidden');
    selectedTextColorControl.classList.add('hidden'); // Also hide text color control
    // Optionally re-enable controls when hidden (though they are usually disabled based on selection type)
    scaleRange.disabled = false;
    rotateRange.disabled = false;
}

// --- Ghost Clone Management ---

/**
 * Removes ALL ghost clones from the canvas.
 * @returns {boolean} - True if any ghosts were removed, false otherwise.
 */
function removeAllGhostClones() {
    if (!canvas) return false;
    let removed = false;
    const objects = canvas.getObjects();
    console.log("Attempting to remove ghost clones. Total objects:", objects.length);

    // Iterate backwards as we are removing items
    for (let i = objects.length - 1; i >= 0; i--) {
        if (objects[i]._isGhostClone) {
            console.log(`Removing ghost clone with ID:`, objects[i].id);
            canvas.remove(objects[i]);
            removed = true;
        }
    }

    console.log("Ghost clones removed:", removed);
    return removed;
}

/**
 * Creates 8 ghost clones for a given object, positioned around it for seamless tiling.
 * @param {fabric.Object} obj - The original object to clone.
 */

function createGhostClonesForObject(obj) {
    if (!obj || !canvas || obj._isGhostClone || obj._isBackground) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    obj.setCoords();

    const positions = [
        { x: -canvasWidth, y: -canvasHeight }, { x: 0, y: -canvasHeight }, { x: canvasWidth, y: -canvasHeight },
        { x: -canvasWidth, y: 0 }, { x: canvasWidth, y: 0 },
        { x: -canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight }, { x: canvasWidth, y: canvasHeight }
    ];

    positions.forEach(pos => {
        obj.clone(cloned => {
            cloned.set({
                left: obj.left + pos.x,
                top: obj.top + pos.y,
                evented: false,
                selectable: false,
                _isGhostClone: true,
                _originalId: obj.id,
                visible: true,
                _shouldBeVisible: true
            });

            // Add the cloned ghost to the canvas and mark it as dirty
            canvas.add(cloned);
            canvas.sendToBack(cloned); // Ensure ghosts are behind originals
            cloned.set('dirty', true); // Mark as needing redraw
        }, ['_isGhostClone', '_originalId', '_shouldBeVisible']);
    });
}

/**
 * Forces a re-render of all objects on the canvas.
 * Useful after complex operations or when Fabric's automatic rendering might miss something.
 */
function forceRenderAllObjects() {
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
        obj.set('dirty', true); // Mark object as needing redraw
        if (obj._isGhostClone) {
            obj.set('visible', true); // Ensure ghosts are visible
        }
    });
    canvas.renderAll(); // Trigger the render cycle
}

/**
 * Updates all ghost clones on the canvas.
 * Removes all existing ghosts and recreates them for all non-ghost, non-background objects.
 */
function updateAllClones() {
    if (!canvas) return;
    console.log("Updating all clones...");
    
    // Remove all existing ghosts first
    const hadGhosts = removeAllGhostClones();
    console.log("Removed existing ghosts:", hadGhosts);

    // Get all original (non-ghost, non-background) objects
    const originalObjects = canvas.getObjects().filter(obj => !obj._isGhostClone && !obj._isBackground);
    console.log("Original objects found:", originalObjects.length);

    // Create new ghost clones for each original object
    originalObjects.forEach(obj => {
        createGhostClonesForObject(obj);
        canvas.bringToFront(obj); // Ensure original objects are always on top of ghosts
    });

    // Request a re-render if clones were added/removed or if originals exist
    if (hadGhosts || originalObjects.length > 0) {
        canvas.getObjects().forEach(obj => obj.set('dirty', true)); // Mark all objects as dirty
        canvas.renderAll(); // Force a full render
    }

    console.log("Clone update complete.");
}


// --- Object Manipulation Functions ---

/**
 * Handles the continuous movement (dragging) of an object.
 * Updates the ghost clones for the *moving* object in real-time for better visual feedback.
 * Also triggers debounced preview updates.
 */
function handleObjectMoving(options) {
    const obj = options.target;
    if (!obj || !canvas || !isDragging || obj._isGhostClone || obj._isBackground) return;

    // Get existing ghost clones for the object
    const ghosts = canvas.getObjects().filter(o => o._isGhostClone && o._originalId === obj.id);
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Define the positions for the ghost clones
    const positions = [
        { x: -canvasWidth, y: -canvasHeight }, { x: 0, y: -canvasHeight }, { x: canvasWidth, y: -canvasHeight },
        { x: -canvasWidth, y: 0 }, { x: canvasWidth, y: 0 },
        { x: -canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight }, { x: canvasWidth, y: canvasHeight }
    ];

    // Update the positions of existing ghost clones
    positions.forEach((pos, i) => {
        if (ghosts[i]) {
            ghosts[i].set({
                left: obj.left + pos.x,
                top: obj.top + pos.y,
                angle: obj.angle,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY
            });
            ghosts[i].setCoords();
        }
    });

    // Force render and debounce preview update
    canvas.requestRenderAll();
    updateTilePreview();
}

/**
 * Handles the mouse up event, typically after dragging an object.
 * Finalizes the object's position and triggers a full update of clones and preview.
 */
function handleMouseUp(options) {
    if (!isDragging) return;
    isDragging = false;

    const target = canvas.getActiveObject();
    if (target && !target._isBackground) {
        finalizeObjectPosition(target);
    }

    // Ensure ghosts are updated before preview
    updateAllClones();
    canvas.requestRenderAll();

    // Trigger preview update after ensuring clones are ready
    setTimeout(() => {
        updateTilePreview(true); // Immediate update
    }, 50); // Small delay to ensure rendering completes
}

/**
 * Adds an image object to the canvas from a data URL.
 * @param {string} url - The data URL of the image.
 */
function addImage(url) {
    if (typeof fabric === 'undefined' || !canvas) return;
    fabric.Image.fromURL(url, function (img) {
        // Scale image proportionally to fit reasonably within the canvas
        const maxDim = Math.max(img.width, img.height);
        const scaleFactor = maxDim > currentSize ? currentSize / maxDim * 0.8 : 0.8; // Scale down if larger, default 80%
        img.scale(scaleFactor).set({
            left: canvas.getWidth() / 2, // Center horizontally
            top: canvas.getHeight() / 2, // Center vertically
            originX: 'center',
            originY: 'center',
            id: Date.now(),
            // Styling for controls
            transparentCorners: false,
            cornerColor: '#3b82f6', // Blue
            cornerSize: 10,
            borderColor: '#3b82f6'
        });
        canvas.add(img); // Add to canvas
        canvas.setActiveObject(img); // Select the new image
        finalizeObjectPosition(img); // Ensure it's wrapped correctly initially
        updateAllClones(); // Update ghosts for all objects
        updateTilePreview(true); // Update background immediately
        canvas.requestRenderAll(); // Redraw canvas
    }, { crossOrigin: 'anonymous' }); // Needed for loading from data URLs/external sources if applicable
}

/**
 * Adds a text object to the canvas based on user input.
 */
function addText() {
    if (typeof fabric === 'undefined' || !canvas) return;
    const textValue = textInput.value.trim(); // Get text from input
    const textColor = textColorInput.value; // Get color from input
    if (!textValue) return; // Don't add empty text

    const text = new fabric.Textbox(textValue, { // Use Textbox for multi-line support
        left: canvas.getWidth() / 2, // Center horizontally
        top: canvas.getHeight() / 2, // Center vertically
        originX: 'center',
        originY: 'center',
        fill: textColor, // Set text color
        fontSize: Math.max(30, currentSize / 10), // Responsive font size
        fontFamily: 'Inter, sans-serif', // Use specified font
        // Styling for controls
        transparentCorners: false,
        cornerColor: '#3b82f6',
        cornerSize: 10,
        id: Date.now(), // Unique ID for the object
        borderColor: '#3b82f6',
        width: currentSize * 0.8, // Limit initial width
        padding: 5, // Add some padding
        angle: parseInt(textRotationInput.value) || 0 // Set initial rotation
    });
    canvas.add(text); // Add to canvas
    canvas.setActiveObject(text); // Select the new text
    finalizeObjectPosition(text); // Ensure it's wrapped correctly initially
    updateAllClones(); // Update ghosts for all objects
    updateTilePreview(true); // Update background immediately
    canvas.requestRenderAll(); // Redraw canvas
    textInput.value = ''; // Clear the input field
}

/**
 * Deletes the currently selected object(s) from the canvas.
 */
function deleteSelectedObject() {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    // Only delete if an object is selected and it's not a ghost or background
    if (activeObject && !activeObject._isGhostClone && !activeObject._isBackground) {
        // Handle multi-selection (group)
        if (activeObject.type === 'activeSelection') {
            activeObject.getObjects().forEach(obj => canvas.remove(obj)); // Remove each object in the group
            canvas.discardActiveObject(); // Deselect the group remnants
        } else {
            // Handle single object selection
            canvas.remove(activeObject); // Remove the single object
        }
        updateAllClones(); // Update ghosts after deletion
        updateTilePreview(true); // Update background immediately
        canvas.requestRenderAll(); // Redraw canvas
        hideControls(); // Hide the controls panel 
    }
    updateTilePreview(true);
}


/**
 * Clones the currently selected object(s).
 */
function cloneSelectedObject() {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    // Only clone if a non-ghost, non-background object is selected
    if (!activeObject || activeObject._isGhostClone || activeObject._isBackground) return;

    // Finalize the original object's position first to ensure clones are based on wrapped position
    finalizeObjectPosition(activeObject);

    activeObject.clone(function (clonedObj) {
        canvas.discardActiveObject(); // Deselect the original
        clonedObj.set({
            left: clonedObj.left + 15, // Offset the clone slightly
            top: clonedObj.top + 15,
            evented: true, // Make the clone interactive
            id: Date.now() // Assign a unique ID (optional)
        });

        // Handle cloning a multi-selection (group)
        if (clonedObj.type === 'activeSelection') {
            clonedObj.canvas = canvas; // Assign canvas reference to the cloned group
            clonedObj.forEachObject(function (obj) { canvas.add(obj); }); // Add each object in the cloned group
            clonedObj.setCoords(); // Update group coordinates
        } else {
            // Handle cloning a single object
            canvas.add(clonedObj); // Add the single cloned object
        }
        canvas.setActiveObject(clonedObj); // Select the new clone(s)
        finalizeObjectPosition(clonedObj); // Finalize the clone's position (wrap if needed)
        updateAllClones(); // Update ghosts for all objects
        updateTilePreview(true); // Update background immediately
        canvas.requestRenderAll(); // Redraw canvas
    }, ['_isGhostClone', '_isBackground']); // Ensure custom properties are NOT cloned
    updateTilePreview(true);
}

// --- Input Event Handlers ---

/**
 * Handles changes to the canvas size input.
 * Re-initializes the canvas with the new size (clears existing content).
 */
function handleCanvasSizeChange(e) {
    let newSize = parseInt(e.target.value, 10);
    // Clamp size within limits
    newSize = Math.max(50, Math.min(1024, newSize));
    if (isNaN(newSize)) newSize = currentSize; // Revert if invalid input
    e.target.value = newSize; // Update input field with clamped value

    if (newSize !== currentSize) {
        currentSize = newSize;
        console.log("Canvas size changed. Re-initializing (clears content).");
        // Re-initialize everything: canvas, listeners, clones, preview
        initCanvas();
    }
}

/**
 * Handles the file input change event for loading images.
 */
function handleImageLoad(e) {
    const file = e.target.files[0];
    if (file && file.type === "image/png") { // Only allow PNGs
        const reader = new FileReader();
        reader.onload = function (event) { addImage(event.target.result); } // Add image on successful read
        reader.onerror = function (err) { console.error("FileReader error:", err); alert("Error reading file."); }
        reader.readAsDataURL(file); // Read file as data URL
        e.target.value = null; // Reset file input
    } else if (file) {
        alert("Please select a PNG file."); // Alert if wrong file type
        e.target.value = null; // Reset file input
    }
}

/**
 * Handles changes to the scale range slider for the selected object.
 */
function handleScaleChange(e) {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    const scale = parseFloat(e.target.value);
    // Apply only to single, non-ghost, non-background objects
    if (activeObject && activeObject.type !== 'activeSelection' && !activeObject._isGhostClone && !activeObject._isBackground) {
        activeObject.scale(scale).setCoords(); // Apply scale and update coordinates
        scaleValue.textContent = scale.toFixed(2); // Update display
        // No need to call finalizeObjectPosition here, object:modified handles it
        updateAllClones(); // Update ghosts based on new scale
        updateTilePreview(); // Update preview (debounced)
        canvas.requestRenderAll(); // Request redraw
    }
}

/**
 * Handles changes to the rotate range slider for the selected object.
 */
function handleRotateChange(e) {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    const angle = parseInt(e.target.value, 10);
    // Apply only to single, non-ghost, non-background objects
    if (activeObject && activeObject.type !== 'activeSelection' && !activeObject._isGhostClone && !activeObject._isBackground) {
        activeObject.set('angle', angle).setCoords(); // Set angle and update coordinates
        rotateValue.textContent = `${angle}°`; // Update display
        // No need to call finalizeObjectPosition here, object:modified handles it
        updateAllClones(); // Update ghosts based on new angle
        updateTilePreview(); // Update preview (debounced)
        canvas.requestRenderAll(); // Request redraw
    }
}

/**
 * Handles changes to the color picker for the selected text object.
 */
function handleSelectedTextColorChange(e) {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    // Apply only to single text objects (textbox or i-text), not ghosts/background
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'i-text') && !activeObject._isGhostClone && !activeObject._isBackground) {
        activeObject.set('fill', e.target.value); // Set text fill color
        // Color changes might not trigger object:modified, so update manually
        updateAllClones();
        updateTilePreview();
        canvas.requestRenderAll(); // Request redraw
    }
}

/**
 * Handles global keydown events for shortcuts.
 */
function handleKeyDown(e) {
    if (!canvas) return;
    const activeElement = document.activeElement;
    // Check if focus is on an input field to avoid conflicts
    const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

    // Delete object shortcut (Delete or Backspace)
    if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject() && !isInputFocused) {
        if (e.key === 'Backspace') e.preventDefault(); // Prevent browser back navigation
        deleteSelectedObject();
    }
    // Toggle preview quality shortcut (Shift + Q) - Keep if quality toggle is used
    // if (e.key === 'Q' && e.shiftKey && !isInputFocused) {
    //     e.preventDefault(); // Prevent typing 'Q'
    //     togglePreviewQuality();
    // }
}

/**
 * Exports the current canvas content as a seamless PNG pattern.
 * Renders the canvas *without* ghosts on a temporary canvas,
 * tiles it 3x3, extracts the center tile, and triggers a download.
 */
function exportPattern() {
    const tilePreviewStyle = window.getComputedStyle(tilePreview);
    const tilePreviewUrl = tilePreviewStyle.getPropertyValue('--tile-preview');

    if (!tilePreviewUrl || tilePreviewUrl === 'none') {
        alert("No preview available to export.");
        return;
    }

    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.download = `seamless_pattern_${currentSize}x${currentSize}.png`;
    link.href = tilePreviewUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''); // Clean up the URL
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Initial Setup ---
// --- NEW: Updated DOMContentLoaded listener ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");

    // Check repeatedly if Fabric.js library is loaded
    const checkFabric = setInterval(() => {
        if (typeof fabric !== 'undefined') {
            clearInterval(checkFabric); // Stop checking once loaded
            console.log("Fabric.js detected.");
            initCanvas(); // Initialize the canvas

            // Optional: Initial render with slight delay to ensure everything is ready
            // This can sometimes help if elements aren't positioned correctly immediately
            setTimeout(() => {
                console.log("Performing initial render and preview update.");
                canvas.renderAll();
                updateTilePreview(true); // Update preview immediately after init
            }, 100);
        } else {
            console.log("Waiting for Fabric.js...");
        }
    }, 100); // Check every 100ms
});