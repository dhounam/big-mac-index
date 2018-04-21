/*jslint white: true, indent: 2, sloppy: true, plusplus: true */
/*global model, window, bigmacGlobals, console */ 


// **************************************************
//    INDIVIDUAL FILTERS -- CUSTOMISE TO REQUIREMENTS
// **************************************************


// FILTER COLOUR.
// Params are data value to look up, current color object
// (calculation flag is in the color object).
// keyIndex is index of key rolled over, or may be undefined.
function filterColour(dataVal, colourO, keyIndex) {
  var cLen, cUint, i, thisCol, cVal, cCol, comparison, defaultCol;
  // Default colour.
  defaultCol = model.layout.path_styles.inactive.fillColor;
  // dataVal not a number:
  if (isNaN(dataVal)) {
    return defaultCol;
  }
  cLen = colourO.length;
  // Actual operation depends upon comparision type.
  comparison = colourO.compare;
  for (i = 1; i <= cLen; i++) {
    thisCol = colourO.colours[i];
    cVal = thisCol.value;
    cCol = thisCol.colour;
    // I'm running through in ascending order (all colour look-up objects are ascending).
    switch (comparison) {
      case "LESS_EQUAL":
        // Break on first val greater than or equal to key value.
        if (dataVal <= thisCol.value) {
          if (keyIndex !== undefined) {
            if (keyIndex === i) {
              return thisCol.colour;
            }
            else {
              return defaultCol;
            }
          }
          else {
            return thisCol.colour;
          }
        }
        break;
      case "LESS":
        // Break on first val greater than key value.
        if (dataVal < thisCol.value) {
          if (keyIndex !== undefined) {
            if (keyIndex === i) {
              return thisCol.colour;
            }
            else {
              return defaultCol;
            }
          }
          else {
            return thisCol.colour;
          }
        }
        break;
      case "EQUAL":
        if (dataVal === thisCol.value) {
          if (keyIndex !== undefined) {
            if (keyIndex === i) {
              return thisCol.colour;
            }
            else {
              return defaultCol;
            }
          }
          else {
            return thisCol.colour;
          }
        }
        break;
      default:
        // Comparison not recognised (ie, I haven't written it yet): use grey. This is a TO DO...
        if (dataVal > thisCol.value) {
          return defaultCol;
        }
    }
  }
  return defaultCol;
}
// FILTER COLOUR ends


// GET ONE INDEX
// Returns an under/overvaluation against a base currency
// Params are the raw data object (current country), price in base currency (eg in US$), 
// local-to-base exchange rate, base-currency index 
function getOneIndex(o, basePrice, baseAdjPrice, xRate, baseI) {
  var localPrice, ppp, result, localPriceInBase, adjLocalPriceInBase, adjBasePriceInBase, s, calcA, calcB;
  // Obj to return.  
  result = {};
  // Calculate PPP: local price / price in base-currency-country.
  localPrice = o.local_price;
  ppp = localPrice / basePrice;  
  result.ppp = ppp;
  // Basic over/under-valuation
  result.basic = ((ppp / xRate) - 1 ) * 100;

  // Adjusted over/under-valuation
  // Local price in base currency
  localPriceInBase = localPrice / xRate;
  result.localPriceInBase = localPriceInBase;
  // GDP-adjusted base-currency price (hard value, based on label looked up in model)
  s = model.currencies[baseI].adjusted;
  adjLocalPriceInBase = o[s];
  // (We have base country local price in param 'basePrice'
  // and base-currency country's GDP-adjusted price in param baseAdjPrice

  /*
  The formula seems to be:
  ( (
  ( Local-price-in-base-currency / GDP-adjusted-base-currency-price ) / 
  ( Base-currency-home-price /  Base-currency GDP-adjusted home price ) 
  ) -1 ) * 100
  */
  calcA = localPriceInBase / adjLocalPriceInBase;
  calcB = basePrice / baseAdjPrice;  
  result.adjusted = ((calcA / calcB) - 1) * 100;
  return result;
}
// GET ONE INDEX ends.



// GET LAST DATASET.
// Called from getIndex to count the number of datasets
function getLastDataset() {
  var allDS, d, counter;
  counter = -1;
  allDS = model.datasets;
  for (d in allDS) {
    if (allDS.hasOwnProperty(d)) {
      counter ++;
    }
  }
  return counter;
}
// GET LAST DATASET ends.


// GET INDEX
// Gets over/undervaluation against base currency.
// So I calculate "ppp": local price / base currency price (each in own currency; may reverse for some base currencies...).
// Then +/-valuation is: ( (ppp / xchRate) - 1 ) * 100.
//    Params are dataset index; topicIndex (0=basic-index; 1=adjusted-index); currency index; key index (which may be undefined)
function getIndex(datasetI, topicI, baseCurrI, keyI) {
  var returnedO, sourceO, oName, o, item, baseNode, baseCountryID, baseXRLabel, baseAdjustedLabel, 
    baseCurrencyPrice, baseCurrencyAdjustedPrice, ppp, xRate, colourNode, topID, dsI, iObj, s, baseGDPLabel,
    baseCurrencyNode, countryNode;
      
  // Fetch name of dataset from the model; assign dataset as source object
  sourceO  = window[model.datasets[datasetI].dataset];
  // Object to return;
  returnedO = {};
  
  // Isolate node on model that defines field names, etc, for the base currency
  baseNode = model.currencies[baseCurrI];
  
  // Country whose base currency we're referencing:
  baseCountryID = baseNode.countryID;
  // Each country has an exchange rate against each base currency;
  // identify label to look up (eg "rate_dollar").
  baseXRLabel = baseNode.rate;
  // Similarly, the label for the field where I'll look for adjusted price.
  baseAdjustedLabel = baseNode.adjusted;
  // And label of field to get GDP (in base currency)
  baseGDPLabel = baseNode.gdp;
  
  // Raw data node for base-currency country
  baseCurrencyNode = sourceO[baseCountryID];

  // From raw data, get base-currency country's local price (eg price of Big Mac in USA).
  baseCurrencyPrice = baseCurrencyNode.local_price;
  // Get base-currency country's GDP-adjusted local price
  baseCurrencyAdjustedPrice = baseCurrencyNode[baseAdjustedLabel];
  
  // Colour stuff: node to take colour vals from.
  topID = model.mapColours.lookup[topicI];
  colourNode = model.mapColours[topID];

  // Loop through countries.
  for (oName in sourceO) {
    if (sourceO.hasOwnProperty(oName)) {
      o = sourceO[oName];
      // (Should I pre-empt currency ag'st itself?).
      
      // Individual-country object, to pack into returned array.
      item = {};
      // ID
      item.id = o.id;
      // Local price.
      item.localPrice = o.local_price;
      
      // Get the exchange rate against the base currency
      xRate = o[baseXRLabel];
      item.xRate = xRate;

      // GDP in base currency  
      item.gdpPerPerson = o[baseGDPLabel];
 
      // Note (if any).
      item.note = o.note;
      
      // Get ppp and basic AND adjusted indices (map and chart only show one, but infobox may want both...).
      iObj = getOneIndex(o, baseCurrencyPrice, baseCurrencyAdjustedPrice, xRate, baseCurrI);
      item.basic = iObj.basic;
      item.ppp = iObj.ppp;
      item.adjusted = iObj.adjusted;
      
      // Price in base currency.
      item.localPriceInBase = iObj.localPriceInBase;

      // Which to map/chart, according to topic:
      if (topicI === 0) {
        item.y = item.basic;
      } 
      else {
        item.y = item.adjusted;
      }

      // Name and currency
      countryNode = model.countries[o.id];
      if (countryNode !== undefined) {
        item.displayLabel = countryNode.name;
        item.currency = countryNode.currency;
      }
    
      // Colour ("color" is for HighCharts).
      item.color = filterColour(item.y, colourNode, keyI);

      // And append to overall object.
      //if (!isNaN(item.y)) {
        returnedO[item.id] = item;
      //}
    }
  }
  
  // Sort array on value:
  //returnedA.sort(function(a, b) {
  //  return a.y - b.y;
  //});
  //returnedA.reverse();
  
  //return returnedA;
  return returnedO;
}
// GET INDEX ends

// PROVIDE BAR CHART DATA
// Filters data for bar chart
function provideBarChartData(dI, dObj) {
  var bcArray, id, temp, sourceO, idrx, countryList;  
  // Incoming dObj is complete filtered dataset
  // bcObj will be a sorted 'translation' with only four fields per sub-object: name, id, color, y
  // *** Mod 20/11/12 limits to countries appearing on the map ***
  
  bcArray = [];
  
  // Convert array of ids on map into a comma-separated string.
  countryList = bigMacGlobals.getPathNameArray().join();
  
  for (id in dObj) {
    if (dObj.hasOwnProperty(id)) {
      // Does country appear on map? Check with map-id array, case-insensitive.
      idrx = new RegExp(id,"i");
      if (idrx.test(countryList)) {
        // Check we've got a valid number
        if (!isNaN(dObj[id].y)) {
          sourceO = dObj[id];
          temp = {};
          temp.name = sourceO.displayLabel;
          if (temp.name !== undefined) {
            temp.id = sourceO.id;
            temp.color = sourceO.color;
            temp.y = sourceO.y;
            bcArray.push(temp);
          }
        }
      }
      
    }
  }
  //
   
  // Sort array on value:
  bcArray.sort(function (a, b) {
    return b.y - a.y;
  });
    
  bigMacGlobals.setBarChartProvider(dI, bcArray);

}
// PROVIDE BAR CHART DATA ends


// MAP-CHART FILTER
// Called on change of dataset, topic or currency index. Or on line chart rollover.
// Filters a dataset according to topic and currency to create
// an object containing ID'd sub-objects of data for map and chart, which is
// saved to bigMacGlobals.
//    Param 'forced' is true for change of topic or currency, where complete recalc is required
//    False for line chart event
function dataFilter(datasetIndex, topicIndex, currencyIndex, keyIndex, forced) {
  var dArray, dObj;
  // If this is for a map, always get latest dataset.
  //if (isMap) {
  //  datasetIndex = getLastDataset();
  //}
  
  
  // Have I filtered this dataset?
  if (forced || (bigMacGlobals.getDataProvider(datasetIndex) === undefined)) {
    dObj = getIndex(datasetIndex, topicIndex, currencyIndex, keyIndex);
    // Pass to global...
    bigMacGlobals.setDataProvider(datasetIndex, dObj);
    provideBarChartData(datasetIndex, dObj);    
  }
  // And return something so caller knows to push on.
  return true; 
}
// DATA FILTER ends


