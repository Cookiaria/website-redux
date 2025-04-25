/**
 * Seamless Tile Editor Script
 *
 * Handles Fabric.js canvas setup, object manipulation (add, move, scale, rotate, delete, clone),
 * ghost clone management for seamless tiling preview, layering, and export.
 * Incorporates fixes for ghost duplication and adds requested features.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables & DOM Elements ---
    let canvas; // Fabric.js canvas instance
    let currentSize = 256; // Initial canvas size
    let isDragging = false; // Flag to track object dragging
    let previewUpdateTimeout; // Timeout ID for debouncing preview updates
    let objectCounter = 0; // Simple counter for unique IDs

    // Panel Controls
    const canvasSizeInput = document.getElementById('canvasSize');
    const imageLoader = document.getElementById('imageLoader');
    const textInput = document.getElementById('textInput');
    const textColorInput = document.getElementById('textColor');
    const textRotationRange = document.getElementById('textRotation');
    const textRotationInput = document.getElementById('textRotationInput'); // New text input
    const addTextBtn = document.getElementById('addTextBtn');
    const exportBtn = document.getElementById('exportBtn');

    // Selected Object Controls Panel
    const objectControls = document.getElementById('objectControls');
    const scaleRange = document.getElementById('scaleRange');
    const scaleInput = document.getElementById('scaleInput'); // New text input
    const rotateRange = document.getElementById('rotateRange');
    const rotateInput = document.getElementById('rotateInput'); // New text input
    const selectedTextColorControl = document.getElementById('selectedTextColorControl');
    const selectedTextColorInput = document.getElementById('selectedTextColor');
    const sendBackBtn = document.getElementById('sendBackBtn'); // New layer button
    const bringFrontBtn = document.getElementById('bringFrontBtn'); // New layer button
    const deleteBtn = document.getElementById('deleteBtn');
    const cloneBtn = document.getElementById('cloneBtn');

    // Editor Area Elements
    const tilePreview = document.querySelector('.tile-preview');
    const canvasWrapper = document.getElementById('canvasWrapper'); // Wrapper div for canvas

    // --- Initialization ---

    /**
     * Initializes the Fabric.js canvas.
     */
    function initCanvas() {
        console.log("Initializing canvas...");
        // Dispose of old canvas if resizing
        if (canvas) {
            canvas.dispose();
            // Remove the old canvas element if it exists
             const oldCanvasEl = canvasWrapper.querySelector('canvas');
             if (oldCanvasEl) {
                 canvasWrapper.removeChild(oldCanvasEl);
             }
             const oldContainer = canvasWrapper.querySelector('.canvas-container');
              if (oldContainer) {
                 canvasWrapper.removeChild(oldContainer);
             }
        }

         // Create a new canvas element
         const canvasEl = document.createElement('canvas');
         canvasEl.id = 'c'; // Ensure it has the ID fabric looks for
         canvasWrapper.appendChild(canvasEl);


        // Set initial size for wrapper and create canvas
        canvasWrapper.style.width = `${currentSize}px`;
        canvasWrapper.style.height = `${currentSize}px`;

        canvas = new fabric.Canvas('c', {
            width: currentSize,
            height: currentSize,
            backgroundColor: 'transparent', // Canvas element transparent
            preserveObjectStacking: true, // Crucial for layering and ghosts
            stopContextMenu: true, // Prevent browser context menu on canvas
        });

        // Add a transparent background rectangle. This helps in selecting objects
        // near the edge but doesn't affect export unless fill is changed.
        const bgRect = new fabric.Rect({
            width: currentSize,
            height: currentSize,
            fill: 'transparent', // No visible background fill
            selectable: false,
            evented: false, // Not interactive
            _isBackground: true, // Custom flag
            id: 'backgroundRect',
        });
        canvas.add(bgRect);
        canvas.sendToBack(bgRect); // Ensure it's the absolute bottom layer

        // Setup listeners
        setupCanvasListeners();
        setupInputListeners();

        // Initial state
        updateAllClones(); // Create initial clones if any objects exist (unlikely at init)
        updateTilePreview(true); // Immediate preview update
        hideControls(); // Hide object controls initially
        console.log(`Canvas initialized with size ${currentSize}x${currentSize}`);

         // Force a render after a short delay to ensure layout is stable
        setTimeout(() => {
            canvas.renderAll();
            updateTilePreview(true);
        }, 50);
    }

    /**
     * Sets up event listeners for the Fabric.js canvas.
     */
    function setupCanvasListeners() {
        if (!canvas) return;
        canvas.off(); // Clear previous listeners

        // Object Selection
        canvas.on({
            'selection:created': updateControlsUI,
            'selection:updated': updateControlsUI,
            'selection:cleared': hideControls,
        });

        // Object Modification (End of Transform/Move)
        canvas.on('object:modified', (e) => {
            if (e.target && !e.target._isBackground) {
                 // Finalize position *before* updating clones
                 const wrapped = finalizeObjectPosition(e.target);
                 // Update clones only if the object actually moved or transformed
                 updateAllClones();
                 updateTilePreview(true); // Immediate preview update
                 updateControlsUI(e); // Update sliders/inputs after modification
            }
             isDragging = false; // Ensure dragging flag is reset
        });

        // Object Moving (During Drag)
        canvas.on('object:moving', handleObjectMoving);

        // Mouse Events for Drag State and Deselection
        canvas.on('mouse:down', (options) => {
            if (options.target && !options.target._isBackground && !options.target._isGhostClone) {
                isDragging = true; // Start dragging an original object
            } else if (!options.target) {
                // Clicked on empty area (or background rect)
                canvas.discardActiveObject();
                hideControls();
                canvas.requestRenderAll();
            }
        });

        canvas.on('mouse:up', handleMouseUp);
    }

    /**
     * Sets up event listeners for HTML input elements.
     */
    function setupInputListeners() {
        // --- Panel Controls ---
        canvasSizeInput.removeEventListener('change', handleCanvasSizeChange);
        canvasSizeInput.addEventListener('change', handleCanvasSizeChange);

        imageLoader.removeEventListener('change', handleImageLoad);
        imageLoader.addEventListener('change', handleImageLoad);

        addTextBtn.removeEventListener('click', addText);
        addTextBtn.addEventListener('click', addText);

        // Text Rotation (Two-way binding)
        textRotationRange.removeEventListener('input', handleTextRotationRange);
        textRotationRange.addEventListener('input', handleTextRotationRange);
        textRotationInput.removeEventListener('change', handleTextRotationInput); // Use 'change' for text input to avoid firing too often
        textRotationInput.addEventListener('change', handleTextRotationInput);

        exportBtn.removeEventListener('click', exportPattern);
        exportBtn.addEventListener('click', exportPattern);

        // --- Selected Object Controls ---
        // Scale (Two-way binding)
        scaleRange.removeEventListener('input', handleScaleRange);
        scaleRange.addEventListener('input', handleScaleRange);
        scaleInput.removeEventListener('change', handleScaleInput);
        scaleInput.addEventListener('change', handleScaleInput);

        // Rotate (Two-way binding)
        rotateRange.removeEventListener('input', handleRotateRange);
        rotateRange.addEventListener('input', handleRotateRange);
        rotateInput.removeEventListener('change', handleRotateInput);
        rotateInput.addEventListener('change', handleRotateInput);

        // Text Color
        selectedTextColorInput.removeEventListener('input', handleSelectedTextColorChange);
        selectedTextColorInput.addEventListener('input', handleSelectedTextColorChange);

        // Layering Buttons
        sendBackBtn.removeEventListener('click', sendLayerBackward);
        sendBackBtn.addEventListener('click', sendLayerBackward);
        bringFrontBtn.removeEventListener('click', bringLayerForward);
        bringFrontBtn.addEventListener('click', bringLayerForward);


        // Action Buttons
        deleteBtn.removeEventListener('click', deleteSelectedObject);
        deleteBtn.addEventListener('click', deleteSelectedObject);
        cloneBtn.removeEventListener('click', cloneSelectedObject);
        cloneBtn.addEventListener('click', cloneSelectedObject);


        // Global Keydowns
        window.removeEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleKeyDown);
    }

    // --- Input Handlers (Two-Way Binding & Actions) ---

    function handleCanvasSizeChange(e) {
        let newSize = parseInt(e.target.value, 10);
        newSize = Math.max(50, Math.min(1024, newSize || currentSize)); // Clamp and fallback
        e.target.value = newSize;
        if (newSize !== currentSize) {
            currentSize = newSize;
            console.log("Canvas size changed. Re-initializing...");
            initCanvas(); // Re-initialize (clears content)
        }
    }

    function handleImageLoad(e) {
        const file = e.target.files[0];
        if (file && file.type === "image/png") {
            const reader = new FileReader();
            reader.onload = (event) => addImage(event.target.result);
            reader.onerror = (err) => { console.error("FileReader error:", err); alert("Error reading file."); };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Please select a PNG file.");
        }
        e.target.value = null; // Reset file input
    }

     // Text Rotation Handlers
    function handleTextRotationRange() {
        const angle = parseInt(this.value, 10);
        textRotationInput.value = angle;
        // Note: This only affects *new* text objects. Existing ones use the main rotation controls.
    }
    function handleTextRotationInput() {
         let angle = parseInt(this.value, 10);
         angle = Math.max(0, Math.min(360, angle || 0)); // Clamp and fallback
         this.value = angle;
         textRotationRange.value = angle;
    }


    // Scale Handlers
    function handleScaleRange() {
        const scale = parseFloat(this.value);
        scaleInput.value = scale.toFixed(2);
        applyScale(scale);
    }
    function handleScaleInput() {
        let scale = parseFloat(this.value);
        scale = Math.max(0.1, Math.min(5, scale || 1)); // Clamp and fallback
        this.value = scale.toFixed(2);
        scaleRange.value = scale;
        applyScale(scale);
    }
    function applyScale(scale) {
        const activeObject = canvas.getActiveObject();
        if (isValidObject(activeObject) && activeObject.type !== 'activeSelection') {
            activeObject.scale(scale).setCoords();
            // Don't finalize position here, let object:modified handle it
            updateAllClonesForObject(activeObject); // Update ghosts immediately for visual feedback
            updateTilePreview(); // Debounced preview update
            canvas.requestRenderAll();
        }
    }

    // Rotate Handlers
    function handleRotateRange() {
        const angle = parseInt(this.value, 10);
        rotateInput.value = angle;
        applyRotation(angle);
    }
    function handleRotateInput() {
        let angle = parseInt(this.value, 10);
        angle = Math.max(0, Math.min(360, angle || 0)); // Clamp and fallback
        this.value = angle;
        rotateRange.value = angle;
        applyRotation(angle);
    }
     function applyRotation(angle) {
        const activeObject = canvas.getActiveObject();
        if (isValidObject(activeObject) && activeObject.type !== 'activeSelection') {
            activeObject.set('angle', angle).setCoords();
            // Don't finalize position here, let object:modified handle it
            updateAllClonesForObject(activeObject); // Update ghosts immediately
            updateTilePreview(); // Debounced preview update
            canvas.requestRenderAll();
        }
    }

    // Selected Text Color Handler
    function handleSelectedTextColorChange(e) {
        const activeObject = canvas.getActiveObject();
        if (isValidObject(activeObject) && (activeObject.type === 'textbox' || activeObject.type === 'i-text')) {
            activeObject.set('fill', e.target.value);
            // Color changes don't trigger object:modified, so update manually
             updateAllClonesForObject(activeObject);
            updateTilePreview();
            canvas.requestRenderAll();
        }
    }

     // Global Keydown Handler
     function handleKeyDown(e) {
        const activeElement = document.activeElement;
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(activeElement?.tagName);

        // Delete object (Delete or Backspace) - only if not focused on input
        if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject() && !isInputFocused) {
            e.preventDefault(); // Prevent Backspace navigation
            deleteSelectedObject();
        }
         // Add other shortcuts if needed (e.g., Ctrl+C, Ctrl+V, Ctrl+Z)
         // Be mindful of browser default actions.
    }

    // --- Core Object Manipulation ---

    /**
     * Checks if an object is valid for manipulation (not null, background, or ghost).
     * @param {fabric.Object} obj
     * @returns {boolean}
     */
    function isValidObject(obj) {
        return obj && !obj._isBackground && !obj._isGhostClone;
    }

    /**
     * Adds an image object to the canvas.
     * @param {string} url - The data URL of the image.
     */
    function addImage(url) {
        if (!canvas) return;
        fabric.Image.fromURL(url, (img) => {
            const maxDim = Math.max(img.width, img.height);
            const scaleFactor = maxDim > currentSize ? (currentSize / maxDim) * 0.8 : 0.8;

            img.set({
                left: canvas.getWidth() / 2,
                top: canvas.getHeight() / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scaleFactor,
                scaleY: scaleFactor,
                id: `obj_${objectCounter++}`, // Assign unique ID
                _originalId: `obj_${objectCounter -1}`, // Store original ID reference
                transparentCorners: false,
                cornerColor: '#3b82f6',
                cornerSize: 10,
                borderColor: '#3b82f6',
                borderScaleFactor: 1.5 // Make border thicker on scaling
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            finalizeObjectPosition(img); // Wrap if needed
            updateAllClones(); // Update all ghosts
            updateTilePreview(true);
            updateControlsUI(); // Show controls for the new object
            canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
    }

    /**
     * Adds a text object to the canvas.
     */
    function addText() {
        if (!canvas) return;
        const textValue = textInput.value.trim();
        const textColor = textColorInput.value;
        const initialAngle = parseInt(textRotationRange.value, 10); // Use the dedicated range/input
        if (!textValue) return;

        const text = new fabric.Textbox(textValue, {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            fill: textColor,
            fontSize: Math.max(24, currentSize / 12), // Responsive font size
            fontFamily: 'Inter, sans-serif',
            angle: initialAngle,
            id: `obj_${objectCounter++}`, // Assign unique ID
             _originalId: `obj_${objectCounter -1}`, // Store original ID reference
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerSize: 10,
            borderColor: '#3b82f6',
            borderScaleFactor: 1.5,
            width: currentSize * 0.8, // Initial max width
            padding: 5,
            splitByGrapheme: true // Better handling of complex characters/emoji
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        finalizeObjectPosition(text); // Wrap if needed
        updateAllClones(); // Update all ghosts
        updateTilePreview(true);
        updateControlsUI(); // Show controls
        canvas.requestRenderAll();
        textInput.value = ''; // Clear input
    }

    /**
     * Deletes the currently selected object(s) and their ghosts.
     */
    function deleteSelectedObject() {
        const activeObject = canvas.getActiveObject();
        if (!isValidObject(activeObject)) return; // Check if valid before proceeding

        const objectsToRemove = [];
        if (activeObject.type === 'activeSelection') {
            // Group selection
            activeObject.getObjects().forEach(obj => {
                if (isValidObject(obj)) { // Double check within group
                    objectsToRemove.push(obj);
                    // Also mark its ghosts for removal
                    canvas.getObjects().forEach(ghost => {
                        if (ghost._isGhostClone && ghost._originalId === obj.id) {
                            objectsToRemove.push(ghost);
                        }
                    });
                }
            });
        } else {
            // Single selection
            objectsToRemove.push(activeObject);
             // Also mark its ghosts for removal
            canvas.getObjects().forEach(ghost => {
                if (ghost._isGhostClone && ghost._originalId === activeObject.id) {
                    objectsToRemove.push(ghost);
                }
            });
        }

        // Remove all marked objects
        objectsToRemove.forEach(obj => canvas.remove(obj));

        canvas.discardActiveObject(); // Deselect
        hideControls();
        updateTilePreview(true); // Update preview immediately
        canvas.requestRenderAll();
        console.log(`Removed ${objectsToRemove.length} objects (including ghosts).`);
    }


    /**
     * Clones the currently selected object(s).
     */
    function cloneSelectedObject() {
        const activeObject = canvas.getActiveObject();
        if (!isValidObject(activeObject)) return;

        // Function to handle cloning of a single object
        const cloneSingleObject = (objToClone) => {
            objToClone.clone((cloned) => {
                 // Assign new unique ID
                const newId = `obj_${objectCounter++}`;
                cloned.set({
                    left: objToClone.left + 15,
                    top: objToClone.top + 15,
                    evented: true,
                    selectable: true,
                    id: newId, // New unique ID
                    _originalId: newId, // It's its own original now
                    _isGhostClone: false, // Ensure it's not marked as a ghost
                    _isBackground: false, // Ensure it's not marked as background
                });

                canvas.add(cloned);
                finalizeObjectPosition(cloned); // Wrap if needed immediately
                createGhostClonesForObject(cloned); // Create ghosts for the new clone
                canvas.setActiveObject(cloned); // Select the new clone
                canvas.requestRenderAll();
                updateControlsUI();
            }, ['id', '_originalId', '_isGhostClone', '_isBackground']); // Properties to include in clone
        };

        canvas.discardActiveObject(); // Deselect original(s) first

        if (activeObject.type === 'activeSelection') {
            // Clone each object in the group individually
            activeObject.getObjects().forEach(obj => {
                if (isValidObject(obj)) {
                    cloneSingleObject(obj);
                }
            });
             // After cloning all, update preview (might select the last cloned item)
             updateTilePreview(true);
        } else {
            // Clone the single selected object
            cloneSingleObject(activeObject);
            // Update preview after single clone
            updateTilePreview(true);
        }
    }

    // --- Ghost Clone Management ---

    /**
     * Removes all ghost clones associated with a specific original object ID.
     * @param {string} originalId - The ID of the original object.
     */
    function removeGhostClonesForObject(originalId) {
        if (!canvas || !originalId) return;
        const ghostsToRemove = canvas.getObjects().filter(obj => obj._isGhostClone && obj._originalId === originalId);
        ghostsToRemove.forEach(ghost => canvas.remove(ghost));
        // console.log(`Removed ${ghostsToRemove.length} ghosts for ${originalId}`);
    }

     /**
     * Removes ALL ghost clones from the canvas.
     */
    function removeAllGhostClones() {
        if (!canvas) return;
        const ghostsToRemove = canvas.getObjects().filter(obj => obj._isGhostClone);
        ghostsToRemove.forEach(ghost => canvas.remove(ghost));
        // console.log(`Removed all ${ghostsToRemove.length} ghost clones.`);
    }

    /**
     * Creates 8 ghost clones for a given object.
     * Ensures ghosts are sent to back initially.
     * @param {fabric.Object} obj - The original object.
     */
    function createGhostClonesForObject(obj) {
        if (!isValidObject(obj) || !canvas) return; // Ensure it's a valid original object

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const originalId = obj.id; // Use the object's unique ID

        if (!originalId) {
            console.error("Cannot create ghosts for object without ID:", obj);
            return;
        }

        // Remove existing ghosts for this object first to prevent duplicates
        removeGhostClonesForObject(originalId);

        const positions = [
            { x: -canvasWidth, y: -canvasHeight }, { x: 0, y: -canvasHeight }, { x: canvasWidth, y: -canvasHeight },
            { x: -canvasWidth, y: 0 },                                         { x: canvasWidth, y: 0 },
            { x: -canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight }, { x: canvasWidth, y: canvasHeight }
        ];

        // Use a synchronous clone method if available, or handle async carefully
        positions.forEach((pos, index) => {
            // Clone properties including transformations
             const cloneProps = {
                left: obj.left + pos.x,
                top: obj.top + pos.y,
                angle: obj.angle,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                originX: obj.originX,
                originY: obj.originY,
                fill: obj.fill, // Clone fill color etc.
                stroke: obj.stroke,
                strokeWidth: obj.strokeWidth,
                // --- Ghost specific properties ---
                evented: false,       // Not interactive
                selectable: false,    // Not selectable
                _isGhostClone: true,  // Mark as ghost
                _originalId: originalId, // Link to original
                id: `${originalId}_ghost_${index}` // Unique ID for the ghost itself
            };

             // Create the clone based on object type
             let ghostClone;
             if (obj.type === 'textbox' || obj.type === 'i-text') {
                 ghostClone = new fabric.Textbox(obj.text, { ...obj.toObject(), ...cloneProps });
             } else if (obj.type === 'image') {
                 // For images, creating from element is more reliable than cloning complex state
                 ghostClone = new fabric.Image(obj.getElement(), { ...obj.toObject(), ...cloneProps });
             } else {
                 // Generic clone for other types (rect, circle, etc.)
                 ghostClone = new obj.constructor({ ...obj.toObject(), ...cloneProps });
             }


            canvas.add(ghostClone);
            // Send the ghost behind its original object specifically.
            // This requires finding the original object's index.
            const originalIndex = canvas.getObjects().indexOf(obj);
            if (originalIndex > -1) {
                 canvas.moveTo(ghostClone, originalIndex); // Move ghost just below original
            } else {
                 canvas.sendToBack(ghostClone); // Fallback: send to absolute back
            }
        });
         // Ensure the original object is on top of its newly created ghosts
         canvas.bringToFront(obj);
         // console.log(`Created 8 ghosts for ${originalId}`);
    }


    /**
     * Updates ghost clones ONLY for a specific object.
     * Removes existing ghosts for that object and recreates them.
     * @param {fabric.Object} obj - The original object to update ghosts for.
     */
    function updateAllClonesForObject(obj) {
        if (!isValidObject(obj) || !canvas) return;
        // console.log(`Updating clones for object: ${obj.id}`);
        removeGhostClonesForObject(obj.id);
        createGhostClonesForObject(obj);
        canvas.requestRenderAll(); // Request render after updating
    }

    /**
      * Updates all ghost clones on the canvas.
      * Removes all existing ghosts and recreates them for all original objects.
      */
    function updateAllClones() {
        if (!canvas) return;
        console.log("Updating ALL clones...");
        const originalObjects = canvas.getObjects().filter(isValidObject);

        // Remove all existing ghosts first
        removeAllGhostClones();

        // Recreate ghosts for each original object
        originalObjects.forEach(obj => {
            createGhostClonesForObject(obj);
        });

         // Ensure originals are on top of their ghosts after creation
         originalObjects.forEach(obj => canvas.bringToFront(obj));

        canvas.requestRenderAll();
        console.log("All clones updated.");
    }


    // --- Dragging and Positioning ---

    /**
     * Handles the continuous movement (dragging) of an object.
     * Updates the positions of the *existing* ghost clones in real-time.
     * Triggers debounced preview updates.
     * FIX: Prevents creation of duplicate ghosts during drag.
     */
    function handleObjectMoving(options) {
        if (!isDragging || !options.target) return; // Only if dragging is active
        const obj = options.target;
        if (!isValidObject(obj)) return; // Only move original objects

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        const originalId = obj.id;

        // Find existing ghosts for this object
        const ghosts = canvas.getObjects().filter(o => o._isGhostClone && o._originalId === originalId);

        const positions = [
            { x: -canvasWidth, y: -canvasHeight }, { x: 0, y: -canvasHeight }, { x: canvasWidth, y: -canvasHeight },
            { x: -canvasWidth, y: 0 },                                         { x: canvasWidth, y: 0 },
            { x: -canvasWidth, y: canvasHeight }, { x: 0, y: canvasHeight }, { x: canvasWidth, y: canvasHeight }
        ];

        // Update positions of the EXISTING ghosts
        ghosts.forEach((ghost, i) => {
            if (positions[i]) { // Check if position exists (should always be 8)
                 ghost.set({
                     left: obj.left + positions[i].x,
                     top: obj.top + positions[i].y,
                     // Also update angle/scale if needed during drag, though less common
                     // angle: obj.angle,
                     // scaleX: obj.scaleX,
                     // scaleY: obj.scaleY
                 });
                 ghost.setCoords(); // Update ghost's coordinates
            }
        });

        // Debounced preview update
        updateTilePreview();
        // No need to call requestRenderAll here, Fabric handles it during move
    }

    /**
     * Handles the mouse up event, finalizing drag operations.
     * Finalizes object position (wrapping) and updates clones/preview.
     */
    function handleMouseUp(options) {
        if (!isDragging) return; // Only act if we were dragging

        const target = options.target || canvas.getActiveObject(); // Get target from event or active obj

        if (isValidObject(target)) {
            console.log(`Mouse up on: ${target.id}`);
            // Finalize position *before* updating clones
            const wrapped = finalizeObjectPosition(target);
             // Update clones *after* position is final
             // Use updateAllClonesForObject for efficiency if only one object moved
             updateAllClonesForObject(target);
             updateTilePreview(true); // Immediate preview update
             canvas.requestRenderAll();
        }
         isDragging = false; // Reset dragging flag regardless
    }

    /**
     * Finalizes an object's position by wrapping it around the canvas edges
     * if its center moves off-canvas. Operates based on object center point.
     * @param {fabric.Object} obj - The object to finalize.
     * @returns {boolean} - True if the object's position was changed, false otherwise.
     */
    function finalizeObjectPosition(obj) {
        if (!isValidObject(obj) || !canvas) return false;

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        let needsUpdate = false;
        let newLeft = obj.left;
        let newTop = obj.top;
        const center = obj.getCenterPoint(); // Get object's center

        // Wrap horizontally based on center
        if (center.x > canvasWidth) newLeft -= canvasWidth;
        else if (center.x < 0) newLeft += canvasWidth;

        // Wrap vertically based on center
        if (center.y > canvasHeight) newTop -= canvasHeight;
        else if (center.y < 0) newTop += canvasHeight;

        // Apply changes if needed
        if (newLeft !== obj.left || newTop !== obj.top) {
            obj.set({ left: newLeft, top: newTop });
            obj.setCoords(); // IMPORTANT: Update object's internal coordinates
            // console.log(`Wrapped object ${obj.id} to ${newLeft}, ${newTop}`);
            needsUpdate = true;
        }
        return needsUpdate;
    }

    // --- Layering ---

    /**
     * Brings the selected object layer (object + ghosts) forward.
     */
    function bringLayerForward() {
        const activeObject = canvas.getActiveObject();
        if (!isValidObject(activeObject) || activeObject.type === 'activeSelection') return; // Only single objects

        const originalId = activeObject.id;
        const layerObjects = canvas.getObjects().filter(o => o.id === originalId || (o._isGhostClone && o._originalId === originalId));

        // Bring all parts of the layer to the front
        layerObjects.forEach(o => canvas.bringToFront(o));

        // Now, ensure correct internal stacking (ghosts behind original)
        const original = layerObjects.find(o => o.id === originalId);
        const ghosts = layerObjects.filter(o => o._isGhostClone);

        if (original) {
            canvas.bringToFront(original); // Ensure original is absolutely last (topmost) in this group
            // Ghosts were already brought forward, so they should be right below the original
        }

        canvas.requestRenderAll();
        updateTilePreview(true); // Update preview to reflect layering change
        console.log(`Brought layer ${originalId} forward.`);
    }

    /**
     * Sends the selected object layer (object + ghosts) backward.
     */
    function sendLayerBackward() {
        const activeObject = canvas.getActiveObject();
        if (!isValidObject(activeObject) || activeObject.type === 'activeSelection') return; // Only single objects

        const originalId = activeObject.id;
        const layerObjects = canvas.getObjects().filter(o => o.id === originalId || (o._isGhostClone && o._originalId === originalId));

        // Send all parts of the layer to the back
        layerObjects.forEach(o => canvas.sendToBack(o));

         // Re-establish correct internal stacking (ghosts behind original)
         // Find the background rectangle to ensure we don't go behind it.
         const bgRectIndex = canvas.getObjects().findIndex(o => o._isBackground);

         const original = layerObjects.find(o => o.id === originalId);
         const ghosts = layerObjects.filter(o => o._isGhostClone);

         // Move ghosts first, ensuring they stay above the background
         ghosts.forEach(ghost => canvas.moveTo(ghost, bgRectIndex + 1));

         // Then move the original object on top of its ghosts
         if (original) {
             const lowestGhostIndex = canvas.getObjects().indexOf(ghosts[0]); // Index of the first ghost
             canvas.moveTo(original, lowestGhostIndex + ghosts.length); // Move original above all its ghosts
         }


        canvas.requestRenderAll();
        updateTilePreview(true); // Update preview to reflect layering change
        console.log(`Sent layer ${originalId} backward.`);
    }

    // --- UI Update Functions ---

    /**
     * Updates the control panel based on the selected object.
     */
    function updateControlsUI(e) {
        const activeObject = canvas.getActiveObject();

        if (!isValidObject(activeObject)) {
            hideControls();
            return;
        }

        objectControls.classList.remove('hidden');

        let currentScale = 1;
        let currentAngle = 0;
        let currentFill = '#000000';
        let isText = false;
        let isGroup = activeObject.type === 'activeSelection';

        // Handle single selection
        if (!isGroup) {
            currentScale = activeObject.scaleX || 1; // Assuming uniform scaling
            currentAngle = Math.round(activeObject.angle || 0);
            isText = activeObject.type === 'textbox' || activeObject.type === 'i-text';
            if (isText) {
                currentFill = activeObject.get('fill');
            }
        }

        // Enable/disable controls based on selection type
        scaleRange.disabled = isGroup;
        scaleInput.disabled = isGroup;
        rotateRange.disabled = isGroup;
        rotateInput.disabled = isGroup;
        selectedTextColorControl.classList.toggle('hidden', !isText || isGroup);
        sendBackBtn.disabled = isGroup; // Disable layering for groups for now
        bringFrontBtn.disabled = isGroup;

        // Update control values
        if (!isGroup) {
            scaleRange.value = currentScale;
            scaleInput.value = currentScale.toFixed(2);
            rotateRange.value = currentAngle;
            rotateInput.value = currentAngle;
            if (isText) {
                selectedTextColorInput.value = currentFill;
            }
        } else {
            // Reset or show placeholder for groups
            scaleRange.value = 1;
            scaleInput.value = '---';
            rotateRange.value = 0;
            rotateInput.value = '---';
        }
    }

    /**
     * Hides the selected object control panel.
     */
    function hideControls() {
        objectControls.classList.add('hidden');
        // Optionally reset control values when hidden
        scaleRange.value = 1;
        scaleInput.value = 1;
        rotateRange.value = 0;
        rotateInput.value = 0;
        selectedTextColorInput.value = '#000000';
    }

    // --- Preview Update ---

    /**
     * Updates the tile preview background.
     * Renders the canvas content (including visible ghosts) to a data URL.
     * @param {boolean} immediate - If true, update immediately; otherwise, debounce.
     */
    function updateTilePreview(immediate = false) {
        if (!canvas) return;
        clearTimeout(previewUpdateTimeout);

        const doUpdate = () => {
            // Ensure all objects (including ghosts) are rendered correctly
            // Ghosts should already be positioned correctly by updateAllClones or handleObjectMoving
            canvas.renderAll(); // Ensure canvas is up-to-date

            // Create data URL directly from the main canvas
            // We rely on preserveObjectStacking and correct ghost placement now
             const dataURL = canvas.toDataURL({
                 format: 'png',
                 quality: 1, // Use high quality for preview
                 // Exclude the background rectangle if you want transparency in the preview itself
                 // This requires the canvas element to have a transparent background
                 // multiplier: 1 // Use native dimensions
             });


            // Apply to the preview div
            tilePreview.style.backgroundImage = `url(${dataURL})`;
            tilePreview.style.backgroundSize = `${currentSize}px ${currentSize}px`;
            // console.log("Tile preview updated.");
        };

        if (immediate) {
            doUpdate();
        } else {
            // Debounce the update
            previewUpdateTimeout = setTimeout(doUpdate, 150); // Adjust delay as needed (e.g., 150ms)
        }
    }


    // --- Export ---

    /**
     * Exports the current canvas content as a seamless PNG pattern.
     * Uses the generated preview data URL directly.
     */
    function exportPattern() {
        if (!canvas) return;

         // Temporarily make all ghosts visible for the export render
         const originalVisibilities = new Map();
         canvas.getObjects().forEach(obj => {
             if (obj._isGhostClone) {
                 originalVisibilities.set(obj.id, obj.visible);
                 obj.visible = true;
             }
              // Hide selection controls during export
             obj.set({
                 hasControls: false,
                 hasBorders: false
             });
         });
         canvas.discardActiveObject(); // Deselect any active object
         canvas.renderAll(); // Render with ghosts visible and no controls


        // Generate Data URL from the canvas state *with* ghosts visible
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
             // Ensure we get the exact canvas dimensions
             width: currentSize,
             height: currentSize,
             left: 0,
             top: 0
        });

         // Restore original ghost visibility and controls
         canvas.getObjects().forEach(obj => {
             if (obj._isGhostClone && originalVisibilities.has(obj.id)) {
                 obj.visible = originalVisibilities.get(obj.id);
             }
             // Restore controls (might need more specific logic if they were hidden selectively)
             obj.set({
                 hasControls: true,
                 hasBorders: true
             });
         });
         canvas.renderAll(); // Render back to normal state


        // Trigger download
        const link = document.createElement('a');
        link.download = `seamless_pattern_${currentSize}x${currentSize}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("Exported pattern.");
    }


    // --- Start the application ---
    // Wait for Fabric.js to be ready (it's deferred)
    const checkFabric = setInterval(() => {
        if (typeof fabric !== 'undefined') {
            clearInterval(checkFabric);
            initCanvas(); // Initialize Fabric canvas and listeners
        } else {
            console.log("Waiting for Fabric.js...");
        }
    }, 100);

}); // End DOMContentLoaded
