/*jslint white: true, indent: 2, devel: true, plusplus: true, sloppy: true */
/*global bigMacGlobals, model, console, $, loadMap, dataFilter, colourMap, drawBarChart, drawKeys, zoomToRegion, highlightPath,
 populateInfoBox, highlightChartElement, drawLineChart */

/* Three sections:
UTILITIES
setDisplayStrings is called from below to force map strings, etc
CONTROLLER:
Main controller calls functions in other components to perform actions.
LISTENERS:
Direct event listeners called by user gestures and on startup.
*/

// SET DISPLAY STRINGS
// Visible strings (map sub/title, source, footnote, chart titles...)
// There's redundancy here: map title is being set unnecessarily...
// Param 3: id of a moused path; if undefined, draw scatter...
function setDisplayStrings(dsIndex, topIndex, pathID) {
  var mTopics, topName, mapT, mapST, currName, chartT, chartST,
    baseIndex, baseCurrencyName, tA, fStr;

  // Map titles. Pull topic-specific strings out of model.
  mTopics = model.topics;
  topName = mTopics.look_up[topIndex];
  mapT = mTopics.tabs[topName].title;
  mapST = mTopics.tabs[topName].subtitle;
  // Subtitle: substitute base currency name.
  currName = model.currencies[model.flags.currency_index].display;
  mapST = mapST.replace(/base/, currName);
  $('.map-title').text(mapT);
  $('.map-subtitle').text(mapST);

  // Get name of base currency...
  baseIndex = model.flags.currency_index;
  baseCurrencyName = model.currencies[baseIndex].display;

  // Chart title: line or scatter...
  if (pathID !== undefined) {
    // ... and active country
    chartT = model.countries[pathID].name;
    $('#line-scatter-chart-div h2')
      .html(chartT)
      .css('color', '#FF0000');
    chartST = modelStrings.line_subtitle + baseCurrencyName;
    // Basic or Adjusted?
    if (topIndex === 1) {
      chartST += ", adjusted for GDP";
    }
    chartST += ", %";
    $('#line-scatter-chart-div h3')
      .html(chartST);
    // FOOTNOTE
    if (topIndex === 0) {
      // Default footnote is 'raw' only.
      fStr = model.topics.tabs.basic.footnote;
      fStr = fStr.replace("%", baseCurrencyName.replace("the ",""));
    }
    else {
      (fStr = "");
    }
    // Euro area special case.
    if (pathID === "EUR") {
      fStr += model.strings.euroareaFootNote;
    }
    // India special case.
    if (pathID === "IND") {
      fStr += model.strings.indiaFootNote;
    }
    // Vietnam special case.
    if (pathID === "VNM") {
      fStr += model.strings.vietnamFootNote;
    }
    // Venezuela special case.
    if (pathID === "VEN") {
      fStr += model.strings.venezuelaFootNote;
    }
    // FOOTNOTE ends.
  }
  else {
    // Scatter chart titles are generic.
    chartT = model.strings.scatter_title;
    $('#line-scatter-chart-div h2')
      .html(chartT)
      .css('color', '#333333');
    //tA = model.datasets[dsIndex].date.split(" ");
    //chartST = tA[1] + " " + tA[2];
    chartST = model.strings.scatter_subtitle;
    $('#line-scatter-chart-div h3')
      .html(chartST);
    // No footnote.
    //fStr = "";
    fStr = modelStrings.scatter_footnote;
  }

  $(".footnote-p").html(fStr);

}
// SET DISPLAY STRINGS ends.

// SET DISPLAY LAYOUT.
// Component visibility, size...
// When we roll over a path/bar, show line chart; hide on exit.
function setDisplayLayout(showLine) {
  if (showLine) {
    $('#scatter-canvas').addClass('hide-chart');
    $('#line-canvas').removeClass('hide-chart');
  }
  else {
    $('#scatter-canvas').removeClass('hide-chart');
    $('#line-canvas').addClass('hide-chart');
  }
}
// SET DISPLAY LAYOUT ends.


/* EVENT STRINGS
    TOPIC_EVENT                 Change of topic (Basic/Adjusted).
    CATEGORY_EVENT              Change CHART category id ("USA").
    DATASET_EVENT               Change dataset (button or slider).
    CHART_ROLL_OVER_EVENT       Chart rollover.
    CHART_ROLL_OUT_EVENT        Chart rollout.
    PATH_ROLL_OVER_EVENT        Map path rollover.
    PATH_ROLL_OUT_EVENT         Map path rollout.
    PATH_CLICK_EVENT            Map path click.
    RESET_BUTTON_CLICK_EVENT    Reset button on map.
    REGION_LIST_CLICK_EVENT     "Zoom to" drop-down.
    EVENT STRINGS end.
*/

// CONTROLLER.
/*  This is where all the dirty work gets done.
 It controls sequences of calls to all constructive functions.
 The controller is only called if a value has changed...
 */
function controller(userEvent, val) {
  // userEvent is a string-constant (see list above) indicating the kind of event that has occurred.
  // Val is an object-id string, or index-value.
  // Interpretation of val depends upon the userEvent.
  // Vars: dataset, topic, map, currency & key indices; path & zoom-to id;
  // and number of datasets in which current country appears...
  var dI, tI, mI, cI, kI, pathID, zoomID, pointCount;
  // Set defaults. dSet, topic or currency index can be overridden by val, below...
  dI = model.flags.dataset_index;
  mI = model.datasets[dI].map_index;
  tI = model.flags.topic_index;
  cI = model.flags.currency_index;
  pathID = bigMacGlobals.getCurrentID();

  if (typeof val === "object") {
    alert("User event " + userEvent + "has sent an object to the controller...");
    return;
  }

  // DATASET: MAP:
  // Called from startupMediator only (map never changes).
  if (userEvent === "DATASET_EVENT_MAP") {
    // "val" is dataset index. But to force map always to last:
    //dI = getLastDataset();
    // Get map index assoc'd with this dataset.
    // If map NEEDS to change.
    if (mI !== model.flags.map_index) {
      // NOTE: map only changes in response to a dataset change; loadMap is in map_components.js.
      if (loadMap(mI, dI)) {
        // Update map index.
        model.flags.map_index = mI;
      } else {
        return;
      }
    }
    // Map and chart colouring, and default infobox, are consequent to data filter
    // Param 5: true to force redraw
    if (dataFilter(dI, tI, cI, undefined, true)) {
      colourMap(dI);
      drawBarChart(dI);
      // Scatter chart is default
      drawScatterChart(dI, tI, cI);
    }
    // In key module:
    drawKeys(tI);
    // Set strings:
    setDisplayStrings(dI, tI);

  }

  // TOPIC.
  if (userEvent === "TOPIC_EVENT") {
    // Change of topic; "val" is topic *index*.
    tI = val;
    // Force unfreeze
    if (bigMacGlobals.getFrozen()) {
      isolatePath(pathID);
    }
    // Map and chart colouring, and default infobox, are consequent to data filter
    if (dataFilter(dI, tI, cI, undefined, true)) {
      colourMap(dI);
      drawBarChart(dI);
      setDisplayStrings(dI, tI);
      setDisplayLayout(false);
    }
    // In key module:
    drawKeys(tI);
    // Scatter chart? I don't think it changes so comm'd out...
    // drawScatterChart(model.flags.dataset_index, val, model.flags.currency_index);
  }

  // BASE CURRENCY.
  if (userEvent === "BASE_CURRENCY_CLICK_EVENT") {
    // Change of base currency; "val" is base currency *index*.
    cI = val;
    // Force unfreeze
    if (bigMacGlobals.getFrozen()) {
      isolatePath(pathID);
    }
    // Map and chart colouring, and default infobox, are consequent to data filter
    if (dataFilter(dI, tI, cI, undefined, true)) {
      colourMap(dI);
      drawBarChart(dI);
      setDisplayStrings(dI, tI);
      setDisplayLayout(false);
      drawScatterChart(dI, tI, cI);
      //populateInfoBox(model.strings.defaultID, true);
    }
    // In key module:
    // drawKeys(val);
  }

  // REGION LIST CLICK.
  if (userEvent === "REGION_LIST_CLICK_EVENT") {
    zoomID = val;
    zoomToRegion(zoomID);
  }


  // MAP ROLLOVER.
  if (userEvent === "MAP_ROLL_OVER_EVENT") {
    // val is path id.
    pathID = val;
    highlightPath(pathID, true);
    populateInfoBox(pathID, dI, true);
    highlightChartElement(pathID, true);

    // Ocean?
    if (pathID !== model.strings.defaultID) {
      setDisplayStrings(dI, tI, pathID);
      setDisplayLayout(true);
    }
    drawLineChart(dI, tI, pathID);
  }

  // MAP ROLLOUT.
  if (userEvent === "MAP_ROLL_OUT_EVENT") {
    // val is path id.
    pathID = val;
    highlightPath(pathID, false);
    populateInfoBox(pathID, dI, false);
    highlightChartElement(pathID, false);
    setDisplayStrings(dI, tI);
    setDisplayLayout(false);
  }

  // MAP CLICK.
  // Only does path isolation?
  if (userEvent === "MAP_CLICK_EVENT") {
    pathID = val;
    isolatePath(pathID);
  }

  // CHART ROLLOVER.
  if (userEvent === "CHART_ROLL_OVER_EVENT") {
    pathID = val;
    populateInfoBox(pathID, dI, true);
    highlightPath(pathID, true);
    setDisplayStrings(dI, tI, pathID);
    // Show scatter and hide line
    setDisplayLayout(true);
    drawLineChart(dI, tI, pathID);
  }

  // CHART ROLLOUT:
  if (userEvent === "CHART_ROLL_OUT_EVENT") {
    pathID = val;
    highlightPath(pathID, false);
    populateInfoBox(pathID, dI, false);
    setDisplayStrings(dI, tI);
    setDisplayLayout(false);
    // drawScatterChart(model.flags.dataset_index, model.flags.topic_index, val);
  }

  // KEY ROLLOVER.
  if (userEvent === "KEY_ROLL_OVER_EVENT") {
    kI = val;
    if (dataFilter(dI, tI, cI, kI, false)) {
      colourMap(dI);
    }
  }
  // KEY ROLLOUT.
  if (userEvent === "KEY_ROLL_OUT_EVENT") {
    if (dataFilter(dI, tI, cI, undefined, false)) {
      colourMap(dI);
    }
  }

  if (userEvent === "LINECHARTPOINT_MOUSE_OVER_EVENT") {
    dI = val;
    pathID = bigMacGlobals.getCurrentID();
    model.flags.dataset_index = dI;
    if (dataFilter(dI, tI, cI, undefined, true)) {
      drawBarChart(dI);
      setDisplayStrings(dI, tI, pathID);
      highlightChartElement(pathID, true);
      populateInfoBox(pathID, dI, true);
    }
  }

  if (userEvent === "LINECHARTPOINT_MOUSE_OUT_EVENT") {
    dI = val;
    pathID = bigMacGlobals.getCurrentID();
    model.flags.dataset_index = dI;
    highlightChartElement(pathID, false);
  }

  if (userEvent === "LINECHART_MOUSE_OUT_EVENT") {
    // This will be tripped off-device when we mouse out of the line chart,
    // or, on-device, click back on the map after clicking on the line chart...
    dI = val;
    pathID = bigMacGlobals.getCurrentID();
    model.flags.dataset_index = dI;
    if (dataFilter(dI, tI, cI, undefined, false)) {
      drawBarChart(dI);
      // No: don't change display yet ('frozen' path is still highlighted...)
      //setDisplayStrings(dI, tI);
      //setDisplayLayout(false);
      highlightChartElement(pathID, false);
      populateInfoBox(pathID, dI, true);
    }
  }
}
// CONTROLLER ends.



// STARTUP MEDIATOR.
// Called by bigmac_interactive_component to kick off.
// Calls controller to load map
//    set default dataset, topic, etc.
function startupMediator() {
  var d = model.flags.dataset_index;
  // Just send constant and index to the controller.
  controller("DATASET_EVENT_MAP", d);
}

// _________
// LISTENERS
/*  Called ***directly*** from user gestures
Swallow events and pass them on to the controller
Passed param is the object that dispatched the event...
...except for topic buttons, which currently send an index
*/

// TOPIC, CURRENCY AND ZOOM BUTTONS
//
// TOPIC BUTTON CLICK
// Called by event on topic menu; param is topic index.
function topicButtonClick(topicI) {
  // "Tab" and highlight effect
  if (topicI !== model.flags.topic_index) {
    // Set path freeze off
    // Comm'd out: the controller calls isolatePath, which turns freeze off...
    // bigMacGlobals.setFrozen(false);
    controller("TOPIC_EVENT", topicI);
    // Pass incoming value to model
    model.flags.topic_index = topicI;
  }
}
// BASE_CURRENCY_BUTTON_CLICK
// Called by event on base currency button
function baseCurrencyButtonClick(bcIndex) {
  // Set name on button.
  var bcName = model.currencies[bcIndex].name;
  $('.currency-dropdown span').html(bcName);
  // Put index on model.
  model.flags.currency_index = bcIndex;
  controller("BASE_CURRENCY_CLICK_EVENT", bcIndex);
}
// REGION LIST CLICK
// Dispatched by region zoom dropdown
// Param is region id
function regionListClick(rIndex) {
  controller("REGION_LIST_CLICK_EVENT", rIndex);
}
// TOPIC, CURRENCY AND ZOOM BUTTONS end


// PATH MOUSE OVER/OUT/CLICK.
// OVER.
// Path on map is passed in as 'this'
function pathMouseOver() {
  var id, pID;
  // Ignore if we've 'frozen' the map:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  id = this.id;
  if (id.length === 0) {
    return;
  }
  pID = bigMacGlobals.getCurrentID();
  // If incoming id is ocean fill, change to default ID on model
  if (id === "oceanfill") {
    id = model.strings.defaultID;
  }
  // IE keeps processing mouseover events while the cursor
  // is over the object, elbowing aside any mouseout. So
  // to prevent this, at first entry a global is set to the
  // object's ID. Further mouseovers on the same path are ignored until
  // the global is set on exit (see pathMouseOut, below)
  if (id !== pID) {
    // Another IE evasion: upon entering a NEW path
    // kill the highlight on the previous path
    if (pID.length > 0) {
      if (!bigMacGlobals.getDeviceFlag()) {
        bigMacGlobals.setCurrentID("");
        controller("MAP_ROLL_OUT_EVENT", id);
      }
    }
    // Remember THIS id.
    bigMacGlobals.setCurrentID(id);
    // Set source off by default, and call controller
    // (unless EC votes -- leave info string set by topic mediator).
    if (model.flags.topic_index !== 1) {
      $('.source').html("");
    }
    controller("MAP_ROLL_OVER_EVENT", id);
  }
}
// OUT.
function pathMouseOut() {
  var id = this.id;
  if (id.length === 0) {
    return;
  }
  // Ignore if we've 'frozen' the map:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  // If incoming id is ocean fill, change to default ID on model.
  if (id === "oceanfill") {
    id = model.strings.defaultID;
  }
  // Empty the current path tracker.
  bigMacGlobals.setCurrentID("");
  controller("MAP_ROLL_OUT_EVENT", id);
}
// CLICK.
function pathClick() {
  var id = this.id, lastID = bigMacGlobals.getCurrentID();
  // If incoming id is ocean fill, change to default ID on model
  if (id === "oceanfill") {
    id = model.strings.defaultID;
  }
  // If we're on a device, path click duplicates rollover
  // But in that case, we need to disable the previous click...
  if (bigMacGlobals.getDeviceFlag()) {
    controller("MAP_ROLL_OUT_EVENT", lastID);
    controller("MAP_ROLL_OVER_EVENT", id);
  }
  else {
    // Non-device - handle frozen flag
    // Only set if not Explorer!
    //if (!bigMacGlobals.getExplorerFlag()) {
      if (bigMacGlobals.getFrozen()) {
        // If map is frozen and we're clicking on the SAME path...
        if (id === lastID) {
          // Click handler does path isolation and handles un/freeze
          controller("MAP_CLICK_EVENT", lastID);
          // Path is frozen from previous click: release...
          //controller("MAP_ROLL_OUT_EVENT", lastID);
        }
        else {
          // If map is frozen, we ignore click on any path except the one that did the freezing
          return;
        }
      }
      else {
        // Map not frozen
        controller("MAP_CLICK_EVENT", lastID);
        //if (id === lastID) {
          //controller("MAP_ROLL_OVER_EVENT", id);
        //}
      }
    //}
  }
  // And remember new ID...
  bigMacGlobals.setCurrentID(id);
}
// PATH OVER/OUT/CLICK ends


// BAR CHART MOUSE OVER/OUT
// Param is chart bar object. Note that these functions
// handle chart highlighting on/off
function barChartMouseOver(cObj) {
  var id = cObj.id;
  if (bigMacGlobals.getDeviceFlag()) {
    return;
  }
  // Ignore if map is frozen:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  // Highlight
  highlightChartElement(id, true);
  // Pass id only
  controller("CHART_ROLL_OVER_EVENT", id);
}
//
function barChartMouseOut(cObj) {
  var id = cObj.id;
  if (bigMacGlobals.getDeviceFlag()) {
    return;
  }
  // Ignore if map is frozen:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  // Un-highlight
  highlightChartElement(id, false);
  // Pass id only
  controller("CHART_ROLL_OUT_EVENT", id);
}
// BAR CHART MOUSE OVER/OUT ends

// BAR CHART CLICK
// Devices only
function barChartClick(bar) {
  var id = bar.id;
  // Ignore if map is frozen:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  // NB: CHART HIGHLIGHT is currently handled within the chart_component
  // So I'm only interested in highlighting the map and getting the info box
  // So duplicate the map-path click procedure
  // If we're on a device, point click duplicates rollover
  // But in that case, we need to disable the previous click...
  if (bigMacGlobals.getDeviceFlag()) {
    controller("CHART_ROLL_OUT_EVENT", bigMacGlobals.getCurrentID());
    controller("CHART_ROLL_OVER_EVENT", id);
  }
  bigMacGlobals.setCurrentID(id);
}
// BAR CHART CLICK ends


// KEY MOUSEOVER/OUT
function keyMouseOver(key) {
  var regExp, keyIndex;
  // Ignore if map is frozen:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  regExp = new RegExp(model.strings.keyPrefix);
  keyIndex = parseInt(key.id.replace(regExp, ""), 10) + 1;
  // Pass index only
  controller("KEY_ROLL_OVER_EVENT", keyIndex);
}
//
function keyMouseOut(key) {
  var regExp, keyIndex;
  // Ignore if map is frozen:
  if (bigMacGlobals.getFrozen()) {
    return;
  }
  regExp = new RegExp(model.strings.keyPrefix);
  keyIndex = parseInt(key.id.replace(regExp, ""), 10) + 1;
  // Pass index only
  controller("KEY_ROLL_OUT_EVENT", keyIndex);
}
// KEY MOUSEOVER/OUT ends.

// LINE CHART MOUSE OVER/OUT.
// Param is line chart point. From this I can extract a date string, which I convert to a dataset index
// then pass up to the controller...
function linechartPointMouseOver(point) {
  var d, m, y, dStr, dIndex, tIndex, cIndex;
  d = new Date(point.category);
  m = d.getMonth();
  y = d.getFullYear();
  dStr = model.strings.shortMonths[m] + y;
  // So dStr = something like "Jul2010". Convert to dataSet index...
  dIndex = model.chart_to_dataset[dStr];
  controller("LINECHARTPOINT_MOUSE_OVER_EVENT", dIndex);
}
function linechartPointMouseOut(point) {
  var d, m, y, dStr, dIndex, tIndex, cIndex;
  d = new Date(point.category);
  m = d.getMonth();
  y = d.getFullYear();
  dStr = model.strings.shortMonths[m] + y;
  // So dStr = something like "Jul2010". Convert to dataSet index...
  dIndex = model.chart_to_dataset[dStr];
  controller("LINECHARTPOINT_MOUSE_OUT_EVENT", dIndex);
}
function linechartMouseOut(point) {
  // Mouseout from line chart resets bar chart to last dataset, to match map
  // Consult function in filters component.
  var dIndex = getLastDataset();
  controller("LINECHART_MOUSE_OUT_EVENT", dIndex);
}
// LINE CHART MOUSE OVER/OUT ends.
