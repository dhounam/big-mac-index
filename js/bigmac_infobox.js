// Handles info box in response to mouse events on map surface
// There's a lot of inferential code in here:
//    - data fields to display
//    - possible calculations

/*jslint white: true, indent: 2, sloppy: true, plusplus: true */
/*global bigMacGlobals, model, console, $, window */

// CHAR_CONVERT
// Entirely inferential function to convert any rogue PC charts to HTML,
// currently for apostrophe, e-acute, euro.
function charConvert(it)
{
  var transPairs, i, thisT, result;
  transPairs = [
    // Space-apostrophe-->space + opening-apos.
    [/\s'/g,' &#145;'],
    // Any other apostrophe to close-apos.
    [/'/g,'&#146;'],
    // E-acute.
    [/È/g,'&eacute;'],
    //Euro.
    [/Û/g,'€']
  ];
  result = it;
  for (i in transPairs) {
    if (transPairs.hasOwnProperty(i)) {
      thisT = transPairs[i];
      result = result.replace(thisT[0], thisT[1]);
    }
  }
  return result;
}
// CHAR_CONVERT ends.

// FILTER INFO VAL
// Called from assembleInfoBoxString. Replaces and simplifies an earlier
// filter on infobox values. This is passed a value and a default no. of
// dec places. Formats numbers over 1000...
function filterInfoVal(v, dps) {
  var val;
  if (v < 1000) {
    val = parseFloat(Math.round(v*100)/100,10).toFixed(dps);
    //val = v.toFixed(dps);
  }
  else {
    val = thouFormat(v.toFixed(0));
  }
  return val;
}


// ASSEMBLE INFO BOX STRING.
// Builds content of Info box.
// Param is relevant dataSet (ie all topics for current path).
function assembleInfoBoxString(dItem) {
  var topicIndex, topicID, modelNode, infoStr, s, val, catNode, val, currency, rExp, bcI, bcSym;
  // Current topic: index & id
  topicIndex = model.flags.topic_index;
  topicID = model.topics.look_up[topicIndex];
  modelNode = model.topics[topicIndex];
  
  // Base currency
  bcI = model.flags.currency_index;
  bcSym = model.currencies[bcI].symbol;

  // Currency (strings without $£€¥ are followed by a space).
  currency = model.countries[dItem.id].currency;
  rExp = /\$|£|€|¥/;
  if (rExp.exec(currency) === null) {
    currency += " ";
  }

  // Initialise string with local price in base currency:
  // (vals go through a crude filter...)
  val = filterInfoVal(dItem.localPriceInBase, 2)
  infoStr = "Price: " + bcSym + val;
  // But actual local price should go to 0dps over 999:
  val = filterInfoVal(dItem.localPrice, 2)
  infoStr += " (" + currency + val + ")<br />";
  
  // Raw/adjusted index
  if (topicIndex === 0) {
    infoStr += "Raw ";
    val = dItem.basic;
  }
  else {
    infoStr += "Adjusted ";
    val = dItem.adjusted;
  }
  // Over/under-valued
  if (!isNaN(val)) {
    if (val >= 0) {
      infoStr += "index: overvalued by " + val.toFixed(1) + "%";
    }
    else {
      infoStr += "index: undervalued by " + Math.abs(val).toFixed(1) + "%";
    }
  }
  else {
    infoStr += "index: not available";
  }
  
  // Actual exchange rate
  val = filterInfoVal(dItem.xRate,2);
  infoStr += "<br/>Actual exchange rate: " + val + "<br />";
    
  // Implied is raw only (and is footnoted--actual footnote done in control).
  if (topicIndex === 0) {
    val = filterInfoVal(dItem.ppp,2);
    infoStr += "Implied exchange rate*: " + val;
  }
  
  return charConvert(infoStr);

}
// ASSEMBLE INFO BOX STRING ends

// SHOW INFO BOX
// Packs content into rollover info box.
function showInfoBox(pathID, dsI) {
  var dataSource, s, d, infoStr, noteStr, tA;
  // Get specific node from current map dataset:
  dataSource = bigMacGlobals.getDataProvider(dsI)[pathID];
  if (dataSource !== undefined) {
    // Country name as header.
    s = model.countries[pathID].name;
    // Date.
    tA = model.datasets[model.flags.dataset_index].date.split(" ");
    d = tA[1] + " " + tA[2];
    // Body.
    infoStr = assembleInfoBoxString(dataSource);
    $('.info-box h2').html(s).fadeIn(50);
    $('.info-box h3').html(d).fadeIn(50);
    $('.info-body').html(infoStr);
    $('.info-body').addClass('show');
    // Popup note field. -- COMM'D OUT SINCE NO NOTES
    /*
    noteStr = dataSource.note;
    if ((noteStr !== undefined) && (noteStr.length > 0)) {
      $('.inner-wrapper-d h4')
        .html(noteStr)
        .addClass('show');
      $('.inner-wrapper-d').animate({height: 60}, 200);
    }
    else {
      // Altho we've a separate hideInfoBox function, this 'else'
      // handles note on/off when we roll over line chart points...
      $('.inner-wrapper-d h4')
        .html('')
        .removeClass('show');
      $('.inner-wrapper-d').animate({height: 0}, 200);
    }
    */
  }
}
// SHOW INFO BOX ends

// HIDE INFO BOX
function hideInfoBox() {
  $('.info-box h2').html("").fadeIn(50);
  $('.info-box h3').html("").fadeIn(50);
  $('.info-body').removeClass('show');
  // And popup note field.
  $('.inner-wrapper-d h4')
    .html('')
    .removeClass('show');
  $('.inner-wrapper-d').animate({height: 0}, 200);
}
// HIDE INFO BOX ends

// THOU FORMAT
// Nicked from: http://www.mredkj.com/javascript/numberFormat.html
// Inserts commas in numbers >= 1,000
function thouFormat(nStr) {
  var x, x1, x2, rgx;
  // Force to string
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

// THOU FORMAT ends

// FILTER INFO VALUE
// Called from assembleInfoBoxString to format data value for display
// Does prefixes, suffixes, '000 formatting...
// Params are value to filter; and topic definition from model
/*    NEVER CALLED SO COMM'D OUT...
function filterInfoValue(dataVal, tNode) {
  var n, vStr;
  // Test for empty value:
  if ((dataVal === "") || (dataVal === null) || (dataVal === "na")) {
    return " no data available";
  }
  // Still here? Value exists... format...
  n = parseFloat(dataVal);
  // Multiply by factor
  n = n * tNode.info_factor;
  if (n === 0) {
    vStr = "0";
  }
  // Vals over one thousand are formatted as 1,000
  // Decimal places setting is (slightly flakily) applied to vals < 1,000
  // And number of decimal places (can apply "on top of" thousands)
  else if (n >= 1000) {
    vStr = thouFormat(n.toFixed(tNode.info_precision));
  } 
  else {
    vStr = n.toFixed(tNode.info_precision);
  }
  // Add any prefix ("$"); and suffix ("%")
  return tNode.info_prefix + vStr + tNode.info_suffix;
}
*/
// FILTER VALUE ends


// Main POPULATE INFO BOX function is called from controller
// Params are id of path rolled over/out of, dataset index, and flag indicating which...
function populateInfoBox(id, dsI, isOver) {
  if (isOver) {
    // Show rollover pop-up. True flag indicates that this
    // is a rollover, rather than a click, so existing rollover deleted
    showInfoBox(id, dsI);
  } else {
    hideInfoBox();
  }
}
// POPULATE INFO BOX ends
