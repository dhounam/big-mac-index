/*jslint white: true, indent: 2, sloppy: true, plusplus: true */

// MAP COMPONENT
/*
  Map loading
  Colouring
  Zoom
  Keys
*/

/*jslint white: true, indent: 2 */
/*global bigMacGlobals, model, console, $, Raphael, window, pathMouseOver, pathMouseOut, pathClick, textMouseOver, textMouseOut */

// ISOLATE PATH
// Called from controller. When user clicks on a path: 
//    set alpha of all other paths (and frame) to zero, and turn their events off
//    set "frozen" flag on
// When user clicks on the isolated path, reverse all the above and set flag off...
function isolatePath(pID) {
  var paper, pnArray, i, pName, pObj, frozen, fObj, zObj, bBox, oObj, overPrefs, outPrefs;
  // Ignore ocean:
  if (pID === model.strings.defaultID) {
    return;
  }
  pnArray = bigMacGlobals.getPathNameArray(); 
  paper = bigMacGlobals.getPaper();
  fObj = paper.getById('frame');
  oObj = paper.getById('oceanfill');
  // 'Active' path uses rollover/out styles
  overPrefs = model.layout.path_styles.rollover;
  outPrefs = model.layout.path_styles.active_default;
  frozen = bigMacGlobals.getFrozen();
  // Reset global flag:
  bigMacGlobals.setFrozen(!frozen);
  if (!frozen) {
    // Map is not frozen
    for (i in pnArray) {
      if (pnArray.hasOwnProperty(i)) {
        pName = pnArray[i];
        pObj = paper.getById(pName);
        if (pName !== pID) {
          // Other paths lose opacity
          // (Current path ignored: already has rollover attributes)
          pObj.animate({'fill-opacity': 0.2, 'stroke-opacity': 0.2}, 300);
        }
      }
    }
    // Frame
    if (fObj !== null) {
      fObj.animate({'stroke-opacity': 0.2}, 300);
    }
    //oObj.animate({'fill': '#AAAAAA'}, 300); -- no: ocean doesn't change
    // Hide zoom and reset buttons, to force us back out the same way we came in... 
    $('.map-zoom').addClass('hide');
    //$('.reset-btn').removeClass('show');
  }
  else {
    // Map is frozen: redisplay all and reset zoom
    for (i in pnArray) {
      if (pnArray.hasOwnProperty(i)) {
        pName = pnArray[i];
        pObj = paper.getById(pName);
        if (pName !== pID) {
        //  pObj.animate({'fill-opacity': 1, 'stroke-opacity': 1, 'stroke': overPrefs.strokeColor, 'stroke-width': overPrefs.strokeWeight}, 300);        
        //}
        //else {
          pObj.animate({'fill-opacity': 1, 'stroke-opacity': 1, 'stroke': outPrefs.strokeColor, 'stroke-width': outPrefs.strokeWeight}, 300);        
        }
      }
    }
    // Zoom out:
    // resetZoom();
    // Frame:
    if (fObj !== null) {
      fObj.animate({'stroke-opacity': 100}, 300);
    }
    //oObj.animate({'fill': '#fff'}, 300);
    // Show zoom button:
    $('.map-zoom').removeClass('hide');
  }
}
// ISOLATE PATH ends.



// LOAD MAP
// Called from controller to:
//    load a new map
//    apply default colours to frames (don't change) and paths
//      (is this necessary, apart from showing me that I'm getting it loaded?
//        all colours are up for resetting when I change dataSet)
// Note that this function doesn't set dataSet/topic-specific colours
// It does, however, set events.
// Params are map and dataSet indices
function loadMap(mapIndex, dsIndex) {
  var onePath, allPaths, oneText, allText, tObj, obj, mapSource, dataSource, myPaper, defaultAttributes, pArray, frameAttributes, oceanAttributes, fObj, oceanObj;
  
  myPaper = bigMacGlobals.getPaper();

  // Create mapSource var, pointing to numbered map path variable
  mapSource = window["map" + mapIndex];

  // Create dataSource var, pointing to "current" dataSet variable (looked up in model)
  dataSource = window[model.datasets[dsIndex].dataset];

  // Clear any existing map
  if (myPaper !== undefined) {
    myPaper.clear();
  }
  // Width/height are inherited from containing map div (JSLint trips over this; ignore)
  myPaper = Raphael('bigmac-map');
  
  // Default viewBox for Reset.
  bigMacGlobals.setDefaultViewBox([0, 0, myPaper.width, myPaper.height]);
  // And set dynamic current viewBox.
  bigMacGlobals.setCurrentViewBox([0, 0, myPaper.width, myPaper.height]);

  // Default attributes are applied to ALL country paths initially
  defaultAttributes = {
    fill : model.layout.path_styles.inactive.fillColor,
    stroke : model.layout.path_styles.inactive.strokeColor,
    'stroke-width' : model.layout.path_styles.inactive.strokeWeight,
    'stroke-linejoin' : model.layout.path_styles.inactive.lineJoin
  };
  // "Frame" attributes. These never change in anger
  frameAttributes = {
    stroke : model.layout.path_styles.frame.strokeColor,
    'stroke-width' : model.layout.path_styles.frame.strokeWeight
  };
  // "Ocean" attributes
  oceanAttributes = {
    'stroke-width' : model.layout.path_styles.ocean.strokeWeight,
    'stroke' : model.layout.path_styles.ocean.strokeColor,
    'fill': model.layout.path_styles.ocean.fillColor
  };

  // Array of path names.
  pArray = [];

  // Loop through path definitions in map object.
  allPaths = mapSource.paths;
  for (onePath in allPaths) {
    if (allPaths.hasOwnProperty(onePath)) {
      // By path:
      obj = myPaper.path(mapSource.paths[onePath].path);
      // Set "my" ID on the path object. I'm currently doing this on the "node"
      // and overwriting Raphael's default ID setting.
      obj.node.id = onePath;
      obj.id = onePath;
      // (NB: by default, obj.id is Raphael's index value, from zero).
    
      // Set default attributes: "frame", "other", or (if neither of these) country... ?
      if (onePath === "frame") {
        // "Frame" gets stroke, no fill
        obj.attr(frameAttributes);
        fObj = obj;
      }
      else if (onePath === "oceanfill") {
        obj.attr(oceanAttributes);
        // Mouse over and out start control chain...
        // ...unless we're on a Device, in which case we ignore mouseover/out.
        if (!bigMacGlobals.getDeviceFlag()) {
          // obj.mouseover(function () {
            // pathMouseOver(this);
          // });
          obj.mouseover(pathMouseOver);
          obj.mouseout(pathMouseOut);
        }
        // Click
        obj.click(pathClick);
        oceanObj = obj;
      }
      else {
          // Map paths get default attributes, since only fill resets in "heat-map"
        // and rollover only resets stroke...
        obj.attr(defaultAttributes);
        // Associated data?
        if (dataSource[onePath] !== undefined) {
          // Pass my path id to array
          pArray.push(onePath);
          // Mouse over and out start control chain...
          // ...unless we're on a Device, in which case we ignore mouseover/out.
          if (!bigMacGlobals.getDeviceFlag()) {
            obj.mouseover(pathMouseOver);
            obj.mouseout(pathMouseOut);
          }
          // Click
          obj.click(pathClick);
        }
        // Associated data condition ends.
      }
      // Frame/path condition ends.
    }
  }
  
  // Frame to front.
  if (typeof fObj !== "undefined") {
    fObj.toFront();
  }
  
  // Ocean to back.
  if (typeof oceanObj !== "undefined") {
    oceanObj.toBack();
  }

  // No text items
  
  // NB: zoom definitions are processed during init process, by ec_interactive_components.
    
  // Remember paper for next time...
  bigMacGlobals.setPaper(myPaper);
  
  // Remember array of path names.
  bigMacGlobals.setPathNameArray(pArray);
  // Fairly pointlessly:
  return true;
}
// LOAD MAP ends.


// *** COLOUR FUNCTIONS ***

// SET COLOUR
// Params are country ID, data value to look up, topic-specific colour object.
// Calls "getColour" to get actual colour val.
function setColour(pathID, col, keyIndex) {
  // Next won't work in IE, so go in via Raphael paper
  //$('#' + pathID).attr("fill", c);
  var pObj = bigMacGlobals.getPaper().getById(pathID);
  // TO DO: I'm only (re-) setting colour on named paths. Two problems with this:
  //    I'm not doing anything about separate strokes for active and inactive paths
  //    I'm assuming consistent data. Can paths switch in/active...?
  if (pObj !== null) {
    pObj.attr("fill", col);
    pObj.attr("stroke-width", model.layout.path_styles.active_default.strokeWeight);
    pObj.attr("stroke", model.layout.path_styles.active_default.strokeColor);
  }
}
// SET COLOUR ends.


// COLOUR MAP
// Called from controller to colour map.
function colourMap(dsIndex) {
  var mapData, i, dataO, pathID, col;  
  // Colour values should already be in global object.
  mapData = bigMacGlobals.getDataProvider(dsIndex);  //Map();
  // Loop through data array.
  for (i in mapData) {
    if (mapData.hasOwnProperty(i)) {
      dataO = mapData[i];
      // Path ID ("GRC" or whatever...), and colour.
      pathID = dataO.id;
      col = dataO.color;
      setColour(pathID, col);
    }
  }
}
// COLOUR MAP ends.

// *** COLOUR FUNCTIONS END ***

// HIGHLIGHT PATH
// Called from CONTROLLER to un/highlight map path
// Params are path id and on/off flag
function highlightPath(id, flag) {
  var tObj, textSet, pObj, fObj;
  
  // Raphael object
  pObj = bigMacGlobals.getPaper().getById(id);
  if ((typeof pObj !== 'object') || (pObj === null)) {
    return;
  }
  // I've tried various approaches to this
  // IE seems to object strenuously to Raphael's animate method
  // So using attr
  if (flag) {
    // Highlight on
    // Stroke + toFront
    pObj.animate({
      'stroke' : model.layout.path_styles.rollover.strokeColor,
      'stroke-width' : model.layout.path_styles.rollover.strokeWeight
    });
    if (!bigMacGlobals.getExplorerFlag()) {
      pObj.toFront();
    }
    fObj = bigMacGlobals.getPaper().getById("frame");
    if ((typeof fObj === "object") && (fObj !== null)) {
      fObj.toFront();
    }
  } 
  else {
    // Highlight off
    pObj.animate({
      'stroke' : model.layout.path_styles.active_default.strokeColor,
      'stroke-width' : model.layout.path_styles.active_default.strokeWeight
    });
  }
}
// HIGHLIGHT PATH ends



// EXECUTE ZOOM
// Called from zoomToPath and resetZoom
// Recursively resets viewbox
function executeZoom(counter, x, y, w, h, cVB, myPaper, zoomCount, reset) {
  // Params are counter; position and size for viewbox
  // Counter controls number of iterations; it is set to zero by
  // calling function, then incremented on each recursion
  var myLeft, myTop, myW, myH;
  // Set next positions
  myLeft = cVB[0] + x;
  myTop = cVB[1] + y;
  myW = cVB[2] + w;
  myH = cVB[3] + h;
  cVB = [myLeft, myTop, myW, myH];
  // Make the move
  myPaper.setViewBox(myLeft, myTop, myW, myH);
  
  // Remember new position
  bigMacGlobals.setCurrentViewBox([myLeft, myTop, myW, myH]);
  // Wait, then recurse, incrementing counter by one
  if (counter < zoomCount) {
    setTimeout(function () {
      executeZoom(counter + 1, x, y, w, h, cVB, myPaper, zoomCount, reset);
    }, 20);
  } else {
    // Show "reset" button
    if (!reset) {
      $('.reset-btn').addClass('show');
    }
  }
}
// EXECUTE ZOOM ends.

// IE ZOOM
// For IE: don't even try to zoom in steps -- just jump
function ieZoom(x, y, w, h) {
  var myPaper, myLeft, myTop, myW, myH, cVB;
  // For IE, I have to reset via a 'zero' viewbox
  myPaper = bigMacGlobals.getPaper();
  myPaper.setViewBox(0, 0, 0, 0);
  cVB = bigMacGlobals.getCurrentViewBox();
  // Set next positions
  myLeft = cVB[0] + x;
  myTop = cVB[1] + y;
  myW = cVB[2] + w;
  myH = cVB[3] + h;
  bigMacGlobals.setCurrentViewBox([x, y, w, h]);
  //myPaper.setViewBox(myLeft, myTop, myW, myH);
  myPaper.setViewBox(x, y, w, h, false);
}
// IE ZOOM ends


// ZOOM TO VIEWBOX
// Called from controller; param is object defining zoom coords
function zoomToViewBox(point) {
  var zoomCount, scaleBy, vbX, vbY, currentLeft, currentTop, currentWidth, currentHeight, newLeft, newTop, newWidth, newHeight, moveX, moveY, resizeX, resizeY, myPaper, cVB;
  zoomCount = model.zoom.zoomCount;
  myPaper = bigMacGlobals.getPaper();
  // Amount to zoom by
  scaleBy = Math.min(myPaper.width / point.width, myPaper.height / point.height);
  // Centre point
  vbX = (point.x + point.width / 2);
  vbY = (point.y + point.height / 2);

  // TO DO: maybe override "required" zoom with a maximum,
  // to prevent us from zooming in too intimately on small
  // paths...

  // Let's start by just moving to the centre point
  // Current top left:
  cVB = bigMacGlobals.getCurrentViewBox();
  currentLeft = cVB[0];
  currentTop = cVB[1];
  currentWidth = cVB[2];
  currentHeight = cVB[3];
  newLeft = point.x - ((myPaper.width - (point.width * scaleBy)) / 2 / scaleBy);
  newTop = point.y - ((myPaper.height - (point.height * scaleBy)) / 2 / scaleBy);
  newWidth = myPaper.width / scaleBy;
  newHeight = myPaper.height / scaleBy;
  moveX = (newLeft - currentLeft);
  // / model.zoom.zoomCount;
  moveY = (newTop - currentTop);
  // / model.zoom.zoomCount;
  resizeX = (newWidth - currentWidth);
  // / model.zoom.zoomCount;
  resizeY = (newHeight - currentHeight);
  // / model.zoom.zoomCount;

  if (bigMacGlobals.getExplorerFlag()) { 
    //ieZoom(moveX, moveY, resizeX, resizeY);
    ieZoom(point.x, point.y, point.width, point.height);
    $('.reset-btn').addClass('show');
  } else {
    moveX /= zoomCount;
    moveY /= zoomCount;
    resizeX /= zoomCount;
    resizeY /= zoomCount;
    executeZoom(0, moveX, moveY, resizeX, resizeY, cVB, myPaper, zoomCount, false);
  }
}
// ZOOM TO VIEWBOX ends


// ZOOM TO REGION
// Called from controller; param is region lookup id
function zoomToRegion(rID) {
  var zObj, rNode;
  //$('#region_button ul').css('display','none');
  zObj = {};
  rNode = model.zoomRegions[rID];
  zObj.x = rNode.left;
  zObj.y = rNode.top;
  zObj.width = rNode.width;
  zObj.height = rNode.height;
  zoomToViewBox(zObj);
}
// ZOOM TO REGION ends


// ZOOM TO PATH
function zoomToPath(p) {
  var zObj = bigMacGlobals.getPaper().getById(p).getBBox(0);
  // Let it breathe
  zObj.x -= 10;
  zObj.y -= 10;
  zObj.width += 20;
  zObj.height += 20;
  zoomToViewBox(zObj);
}
// ZOOM TO PATH ends

// RESET ZOOM
// Called from "Reset" button to reset map to default position
function resetZoom() {
  var myPaper, zoomCount, currentLeft, currentTop, currentWidth, currentHeight, newLeft, newTop, newWidth, newHeight, moveX, moveY, resizeX, resizeY, vb, cVB;
  zoomCount = model.zoom.zoomCount;
  // Current viewbox:
  cVB = bigMacGlobals.getCurrentViewBox();
  myPaper = bigMacGlobals.getPaper();
  currentLeft = cVB[0];
  currentTop = cVB[1];
  currentWidth = cVB[2];
  currentHeight = cVB[3];
  // Default
  vb = bigMacGlobals.getDefaultViewBox();

  newLeft = vb[0];
  newTop = vb[1];
  newWidth = vb[2];
  newHeight = vb[3];
  moveX = (newLeft - currentLeft);
  // / model.zoom.zoomCount;
  moveY = (newTop - currentTop);
  // / model.zoom.zoomCount;
  resizeX = (newWidth - currentWidth);
  // / model.zoom.zoomCount;
  resizeY = (newHeight - currentHeight);
  // / model.zoom.zoomCount;

  if (bigMacGlobals.getExplorerFlag()) {
    //ieZoom(moveX, moveY, resizeX, resizeY);
    ieZoom(newLeft, newTop, newWidth, newHeight);
  } else {
    moveX /= zoomCount;
    moveY /= zoomCount;
    resizeX /= zoomCount;
    resizeY /= zoomCount;
    // zoomCount-1 to get back to "zero".
    executeZoom(0, moveX, moveY, resizeX, resizeY, cVB, myPaper, zoomCount - 1, true);
  }

  // Hide reset button
  $('.reset-btn').removeClass('show');
}
// RESET ZOOM ends



// DRAW KEYS
/* Called from controller when topic or dataSet changes (dataSet change is
 *   a bit redundant, except at startup...).
 * Draws map keys. This is complicated for Big Mac. I have three divs:
 *    left has 3 undervalued keys
 *    centre has roughly-equal
 *    right has 3 overvalued
 */
function drawKeys(topI) {
  var topID, cNode, c, parentW, keyW, k, thisKey, leftKeys, centreKey, rightKeys, mapKeys, s;
  // Topic ID ("basic" or "adjusted")
  topID = model.topics.look_up[topI];
  // Look up colours in:
  cNode = model.mapColours[topID].colours;

  // Delete existing keys, if any (centre div has different construction, so target specific elements).
  $('.map-keys').remove();
  $('.key-sub-centre div').remove();
  $('.key-sub-centre span').remove();

  leftKeys = '';
  rightKeys = '';

  // Draw one key.
  s = model.strings.keyPrefix;
  k = 0;
  mapKeys = '';
  for (c in cNode) {
    if (cNode.hasOwnProperty(c)) {
      thisKey = s + k;
      if (k < 3) {
        leftKeys += '<li><span id="' + thisKey + '" style="background-color: ' + cNode[c].colour + '"></span>' + cNode[c].display + '</li>';
        //leftKeys += '<li><span id="' + thisKey + '" style="background-color: ' + cNode[c].colour + '">' + cNode[c].display + '</span></li>';
      }
      else if (k > 3) {
        rightKeys += '<li><span id="' + thisKey + '" style="background-color: ' + cNode[c].colour + '"></span>' + cNode[c].display + '</li>';
      }
      else {
        centreKey = '<div id="' + thisKey + '"" class="key-sub-centre-div" style="background-color: ' + cNode[c].colour + '"></div><span>' + cNode[c].display + '</span>';
      }
      k++;
    }
  }


  // Add the keys to the map.
  $('.key-sub-left').append('<ul class="map-keys">' + leftKeys + '</ul>');
  $('.key-sub-centre').append(centreKey);
  $('.key-sub-right').append('<ul class="map-keys">' + rightKeys + '</ul>');

  // IE: get inferentially at key font sizes (now they exist)
  //if (bigMacGlobals.getExplorerFlag()) {
  //  $('.map-keys li').css('font-size', '9px');
  //}

  // Set events
  $(".map-keys li span").mouseover(function () {
    keyMouseOver(this);
  });
  $(".map-keys li span").mouseout(function () {
    keyMouseOut(this);
  });

  $(".key-sub-centre div").mouseover(function () {
    keyMouseOver(this);
  });
  $(".key-sub-centre div").mouseout(function () {
    keyMouseOut(this);
  });
}
// DRAW KEYS ends


