/*jslint white: true, indent: 2, sloppy: true, plusplus: true */
/*global bigMacGlobals, model, console, $, Highcharts, window, getOneIndex */

/*
 * Two possible things to watch out for:
 * Plotbands are hard-coded Jul/Sep/Nov, since that is assumed lifespan.
 * No min/max/incr set. Highcharts seems able to handle the range itself.
*/

// BUILD LINE CHART
// Creates Highcharts chart object.
function buildLineChart() {
  var tempChart, seriesArray, h, w;
  // It seems that I have to force size...
  h = $('#line-canvas').css('height').replace(/px/,'');
  w = $('#line-canvas').css('width').replace(/px/,'');
  // Empty data array.
  seriesArray = ['',''];

/*
  tempChart = new Highcharts.Chart({
    chart : {
      renderTo : 'line-canvas',
      defaultSeriesType : 'line'
    }  ,
    series : [{
      data: seriesArray
    }]
  });

  bigMacGlobals.setLineChart(tempChart);
  return true;
*/


  // CHART definition.
  tempChart = new Highcharts.Chart({
    chart : {
      renderTo : 'line-canvas',
      defaultSeriesType : 'line',
      animation: {
        duration: 500,
        easing: 'linear'
      },
      borderRadius: 0,
      marginBottom: 25,
      marginLeft: 40,
      marginRight : 40,
      marginTop : 20,
      height: h,
      width: w
      },
    title : {
      text : null,
      align : 'left'
    },
    subtitle : {
      text : null,
      align : 'left'
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      series: {
        lineWidth: 3,
        marker: {
          enabled: true,
          radius: 4,
          lineColor: null,
          states: {
            hover: {
              enabled: true,
              fillColor: '#FF0000',
              lineWidth: 2
            }
          }
        },
        point: {
          events: {
            mouseOver: function() {
              linechartPointMouseOver(this);
            },
            mouseOut: function() {
              linechartPointMouseOut(this);
            }
          }
        },
        stickyTracking: true,

        events: {
          mouseOut: function() {
            linechartMouseOut(this);
            }
        }

      }
    },


    tooltip : {
      enabled: false
    },

    xAxis: {
      type: 'datetime',
      alternateGridColor: model.layout.colours.lineChartPlotBands,
      // Tick interval is yearly
      tickInterval: 365 * 24 * 3600 * 1000,
      startOnTick: true,
      endOnTick: true,
      dateTimeLabelFormats: {
        // month: '%b'
        // For long month name use '%B'.
      },
      tickLength: 10,
      // Labels
      labels: {
        align: 'center',
        // Position of date string in 'slot' is hard-coded and may have to adapt as the number of years increases...
        x: 15,
        y: 20,
        style: {
          color: '#555555',
          fontWeight: 'normal',
          fontSize: '12px',
          fontFamily: 'Verdana, Geneva, sans-serif'
        },
        formatter: function () {
          var lStr;
          lStr = new Date(this.value).getFullYear();
          // Only 5-yearly display "yyyy"; others are just "yy"
          if (lStr % 5 !== 0) {
            lStr = lStr.toString().substr(2);
          }
          // 'White' out rogue extra year...
          if (this.isLast) {
            lStr = '<span style="fill: white;">' + lStr + '</span>';
          }
          return lStr;
        }
      }
      // Labels end.
    },
    yAxis: {
      title: {
        text: null
      },
      labels: {
        align: 'right',
        x: -5,
        y: 4
      }
    },
    symbols : ['circle', 'circle'],
    series : [{
      data: seriesArray
    }]

  });

  bigMacGlobals.setLineChart(tempChart);
  return true;
}
// BUILD LINE CHART ends


// UPDATE LINE CHART
// Params are: dataSet index, topic index, path ID
function updateLineChart(dsIndex, topIndex, pathID) {
  var baseIndex, baseCountryID, baseCurrencyPrice, baseRateLabel, baseCurrencyName, baseCurrencyAdjustedPrice, dsPropsList, localNode, dsProps, thisDS,
    seriesArray, i, thisDate, thisVal, xRate, isAdjusted, tempArray, tempChart, utcDate,
    titleString, subString, valO, s, minVal, maxVal;

  tempChart = bigMacGlobals.getLineChart();
  if (tempChart === undefined) {
    alert("Unable to update non-existent chart...");
    return;
  }

  // Base currency: ID of base country...
  baseIndex = model.flags.currency_index;
  baseCountryID = model.currencies[baseIndex].countryID;
  baseCurrencyName = model.currencies[baseIndex].display;
  // A label name identifying the exchange rate to use in the local node
  baseRateLabel = model.currencies[baseIndex].rate;

  // Basic or Adjusted?
  isAdjusted = (model.flags.topic_index === 1);

  minVal = 0;
  maxVal = 0;

  // Array holds series data. It will be an array of 2-element sub-arrays [UTCdate, val].
  seriesArray = [];

  /*
  * Although I pass in the dsIndex, I actually want to loop through ALL datasets, getting the under/over-valuation
  * First, set up the loop
  */
  dsPropsList = model.datasets;
  for (i in dsPropsList) {
    if (dsPropsList.hasOwnProperty(i)) {
      tempArray = [];
      // Dataset properties on model:
      dsProps = dsPropsList[i];
      // Grab a single dataset (all countries).
      thisDS = window[dsProps.dataset];
      // Current country in that dataset...
      localNode = thisDS[pathID];
      // ...may not exist, in which case move on.
      if (localNode !== undefined) {
        // I want a date and an over/under-valuation index
        thisDate = new Date(dsProps.date);
        utcDate = Date.UTC(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate());
        // I need local price, price in base currency...
        baseCurrencyPrice = thisDS[baseCountryID].local_price;
        // Get base-currency country's GDP-adjusted local price
        s = model.currencies[baseIndex].adjusted;
        baseCurrencyAdjustedPrice = thisDS[baseCountryID][s];
        // Exchange rate of local currency against the base currency:
        // Watch out: THIS IS SOMETHING THAT MAY "TURN".
        xRate = localNode[baseRateLabel];
        // Function in filters_component calculates under/overvaluation
        // then returns an object with ppp and basic/adjusted indices.
        //valO = getOneBasicIndex(localNode, baseCurrencyPrice, xRate, baseIndex);
        valO = getOneIndex(localNode, baseCurrencyPrice, baseCurrencyAdjustedPrice, xRate, baseIndex);
        if (isAdjusted) {
          thisVal = valO.adjusted;
        } else {
          thisVal = valO.basic;
        }
        if (!isNaN(thisVal)) {
          tempArray.push(utcDate);
          tempArray.push(thisVal);
          seriesArray.push(tempArray);
          // Min/max
          if (thisVal < minVal) {
            minVal = thisVal;
          }
          if (thisVal > maxVal) {
            maxVal = thisVal;
          }
        }
      }
    }
  }

  // This is a panic fix for too few data points, or missing adjusted values
  // (overrides line chart subtitle prev'y set in control/setDisplayStrings)
  if (seriesArray.length < model.linechartMinPoints) {
    $('#line-canvas').addClass('hide-chart');
    $('#line-scatter-chart-div h3')
      .html("Insufficient data to display line chart");
    // If no data AT ALL, shout louder:
    if (seriesArray.length === 0) {
      $('#line-scatter-chart-div h3')
        .html("No data available");
    }
  }

  // Chart attributes
  //tempChart.setTitle(titleStrObj,subStrObj);
  // New data; note that to get the animation, we have to set redraw param to 'false'
  // then do an explicit redraw below...
  tempChart.series[0].setData(seriesArray, false);
  // At the moment, I'm letting it do its own thing with min/max.
  //tempChart.yAxis[0].options.tickInterval = chartIncr;
  //tempChart.yAxis[0].setExtremes(chartMin, chartMax);
  // Plotline: remove any existing, then set if scale straddles zero.
  if (tempChart.yAxis[0].plotLinesAndBands.length > 0) {
    tempChart.yAxis[0].removePlotLine('zero_line');
  }
  if ((minVal <= 0) && (maxVal >= 0)) {
    tempChart.yAxis[0].addPlotLine({
      value: 0,
      color: 'red',
      width: 2,
      id: 'zero_line',
      zIndex: 2
      });
  }
  tempChart.redraw();
  // And remember me.
  bigMacGlobals.setLineChart(tempChart);
}
// UPDATE LINE CHART ends



// DRAW LINE CHART
// Called from controller. Calls functions to (initially) create
// and (subsequently) update chart...
function drawLineChart(dsIndex, topIndex, pathID) {
  var thisChart;

  // Sanity checks
  if ((pathID.length === 0)  || (model.countries[pathID] === undefined)) {
    return;
  }

  // Look for this chart. If it exists, it's just updated; otherwise built from the ground up...
  thisChart = bigMacGlobals.getLineChart();

  if (thisChart !== undefined) {
    // Exists: update only
    updateLineChart(dsIndex, topIndex, pathID);
  }
  else {
    // Doesn't exist: build it
    if (buildLineChart()) {
      updateLineChart(dsIndex, topIndex, pathID);
    }
  }
}
// DRAW LINE CHART

