/*jslint white: true, indent: 2, sloppy: true, plusplus: true */
// BUILD SCATTER CHART
// Creates Highcharts chart object.
function buildScatterChart() {
  var tempChart, seriesArray, linRegArray;
  // Empty data array.
  seriesArray = ['', ''];
  linRegArray = ['', ''];
  // CHART definition.
  tempChart = new Highcharts.Chart({
    chart : {
      renderTo : 'scatter-canvas',
      animation: {
        duration: 1000,
        easing: 'swing'
      },
      defaultSeriesType : 'scatter',
      marginBottom: 50,
      marginLeft: 70,
      marginRight : 35,
      marginTop : 20,
      borderRadius : 0
    },
    title : {
      text : null,
      align : 'left'
    },
    subtitle : {
      text : null,
      align : 'left'
    },
    credits : {
      enabled : false
    },
    legend : {
      enabled : false
    },
    xAxis : {
      tickLength : 10,
      // Labels
      labels : {
        align : 'center',
        x : 0,
        y : 25,
        style : {
          color : '#555555',
          fontWeight : 'normal',
          fontSize : '12px',
          fontFamily : 'Verdana, Geneva, sans-serif'
        }
      },
      // Labels end.
      title: {
        text: model.strings.scatterXTitle,
        align: 'middle',
        margin: 15,
        style: {
          color: '#555555',
          fontFamily: 'Verdana, Arial, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'italic'
        }
      }
    },
    yAxis : {
      title : {
        text: model.strings.scatterYTitle,
        align: 'middle',
        //margin: 20,
        style: {
          color: '#555555',
          fontFamily: 'Verdana, Arial, sans-serif',
          fontWeight: 'normal',
          fontStyle: 'italic'
        }

      }
    },
    tooltip : {
      backgroundColor : '#fff',
      borderRadius : 0,
      borderWidth : 2,
      borderColor: '#AAAAAA',
      formatter: function() {
        var cSymb = model.currencies[model.flags.currency_index].symbol;
        return '<span style="color:red; font-weight:bold;">' + this.key +
          '</span><br />GDP per person: ' + cSymb + thouFormat((this.x * 1000).toFixed(0)) +
          '<br />Big Mac price: ' + cSymb + this.y.toFixed(2);
      },
      // Positioner doesn't work: maybe we're using obsolete version of Highcharts...
      // Did work if I called "from-site" version; but then that stopped tooltips working at all!
      // Awaiting fix (6 Aug)
      positioner: function(w, h, point) {
        return {
          x: 410,
          y: 80
        };
      },
      shared : false,
      shadow : false,
      style : {
        padding : 3,
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontWeight : 'normal',
        fontSize : '11px'
      }
    },
    series: [{
        // Series 0: regression line
        type: 'line',
        name: "Regression line",
        data: linRegArray,
        color: 'red',
        dataLabels : false,
        marker: {
          enabled: false
        },
        enableMouseTracking: false      },
      {
        // Series 1: scatter points
        type: 'scatter',
        name: "Scatter points",
        data: seriesArray,
        dataLabels: true,
        marker : {
          enabled: true,
          fillColor: '#FFFFFF',
          lineColor: '#AAAAAA',
          lineWidth: 2,
          radius : 5,
          symbol: 'circle',
          states : {
            hover : {
              enabled : true,
              fillColor: 'red'
            }
          }
        },
        stickyTracking: false
      }
    ]

  });

  bigMacGlobals.setScatterChart(tempChart);
  return true;
}

// BUILD SCATTER CHART ends




// FIND LINE BY LEAST SQUARES
function findLineByLeastSquares(values_x, values_y) {
  var sum_x, sum_y, sum_xy, sum_xx, count, x, y, values_length, v, m, b,
    result_values_x, result_values_y;
  sum_x = 0;
  sum_y = 0;
  sum_xy = 0;
  sum_xx = 0;
  count = 0;

  /*
  * We'll use those variables for faster read/write access.
  */
  x = 0;
  y = 0;
  values_length = values_x.length;

  if (values_length !== values_y.length) {
    throw new Error('The parameters values_x and values_y need to have same size!');
  }

  /*
  * Nothing to do.
  */
  if (values_length === 0) {
    return [ [], [] ];
  }

  /*
  * Calculate the sum for each of the parts necessary.
  */
  for (v = 0; v < values_length; v++) {
    x = values_x[v];
    y = values_y[v];
    sum_x += x;
    sum_y += y;
    sum_xx += x*x;
    sum_xy += x*y;
    count++;
  }

  /*
  * Calculate m and b for the formular:
  * y = x * m + b
  */
  m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
  b = (sum_y/count) - (m*sum_x)/count;

  /*
  * We will make the x and y result line now
  */
  result_values_x = [];
  result_values_y = [];

  for (v = 0; v < values_length; v++) {
    x = values_x[v];
    y = x * m + b;
    result_values_x.push(x);
    result_values_y.push(y);
  }

  return [result_values_x, result_values_y];
}

// PREP LR
function prepLR(a) {
  var result, valsX, valsY, i, aLen, thisL, o, returnedArray;

  valsX = [];
  valsY = [];
  aLen = a.length;
  for (i = 0; i < aLen; i++) {
    thisEl = a[i];
    valsX.push(thisEl.x);
    valsY.push(thisEl.y);
  }

  result = findLineByLeastSquares(valsX, valsY);

  // Result is an array of 2 elements:
  //    0:  an array of simple x values
  //    1:  an array of simple y values
  // I want a single array of objects, each with x & y properties. So...
  returnedArray = [];
  aLen = result[0].length;
  for (i = 0; i < aLen; i++) {
    o = {};
    o.x = result[0][i];
    o.y = result[1][i];
    returnedArray.push(o);
  }

  // Sort:
  returnedArray.sort(function (a, b) {
    return a.x - b.x;
  });

  return returnedArray;
}


// UPDATE SCATTER CHART
// Params are: dataSet index, topic index, base-currency index
function updateScatterChart(dsIndex, topIndex, baseIndex) {
  var tempChart, topicInfoNode, xMax, yMax, dataObj, id, scatterArray, sourceO, x, y,
    tempO, chartMin, xIncr, yIncr, xTitle, yTitle, myDate, baseCurrency, linRegArray, tA;

  tempChart = bigMacGlobals.getScatterChart();
  if (tempChart === undefined) {
    alert("Unable to update non-existent chart...");
    return;
  }

  // Find topic details on model
  topicInfoNode = model.topics.tabs[topIndex];

  // Get actual min and max on the fly
  xMax = 0;
  yMax = 0;

  // Scatter chart uses current map data provider:
  dataObj = bigMacGlobals.getDataProvider(dsIndex);  //Map();
  scatterArray = [];
  for (id in dataObj) {
    if (dataObj.hasOwnProperty(id)) {
      sourceO = dataObj[id];
      x = sourceO.gdpPerPerson / 1000;
      if (x > xMax) {
        xMax = x;
      }
      y = sourceO.localPriceInBase;
      if (y > yMax) {
        yMax = y;
      }
      if ((!isNaN(x)) && (!isNaN(y))) {
        tempO = {};
        tempO.name = model.countries[id].name;
        tempO.x = x;
        tempO.y = y;
        scatterArray.push(tempO);
      }
    }
  }

  /*
   * scatterArray is an unsorted array of objects, each of which has properties:
   * id, name, x (GDP per person), y (Big Mac price in base currency)...
   */

  // Linear Regression series
  linRegArray = prepLR(scatterArray);


  // Min/max/incr -- fcn in separate component:
  // Nail min down
  chartMin = 0;
  // X-axis
  minMaxObject = makeMinMaxObject(chartMin, xMax, 6);
  xMax = minMaxObject.max;
  xIncr = minMaxObject.increment;
  // Y-axis
  minMaxObject = makeMinMaxObject(chartMin, yMax, 6);
  yMax = minMaxObject.max;
  yIncr = minMaxObject.increment;
  // Base currency symbol.
  baseCurrency = model.currencies[model.flags.currency_index].symbol;

  // Axis title strings, amended from model.
  xTitle = model.strings.scatterXTitle;
  // Date from list; lose day.
  tA = model.datasets[model.flags.dataset_index].date.split(" ");
  myDate = tA[1] + " " + tA[2];
  xTitle = xTitle.replace(/date/, myDate).replace(/currencysymbol/, baseCurrency);
  yTitle = model.strings.scatterYTitle;
  yTitle += baseCurrency;

  // Chart attributes
  // New data; note that to get the animation, we have to set redraw param to 'false'
  // then do an explicit redraw below...
  tempChart.series[0].setData(linRegArray, false);
  tempChart.series[1].setData(scatterArray, false);
  // Scales
        tempChart.xAxis[0].setTitle({
            text: xTitle
        });
  tempChart.xAxis[0].options.tickInterval = xIncr;
  tempChart.xAxis[0].setExtremes(chartMin, xMax);
  //tempChart.yAxis[0].setTitle({
  // text: model.strings.scatterYTitle
  // });
        tempChart.yAxis[0].setTitle({
            text: yTitle
        });
  tempChart.yAxis[0].options.tickInterval = yIncr;
  tempChart.yAxis[0].setExtremes(chartMin, yMax);
  tempChart.redraw();

  // And remember me.
  bigMacGlobals.setScatterChart(tempChart);


}


// DRAW SCATTER CHART
// Called from controller. Calls functions to (initially) create
// and (subsequently) update chart...
function drawScatterChart(dsIndex, topIndex, pathID) {
  var thisChart;

  // Look for this chart. If it exists, it's just updated; otherwise built from the ground up...
  thisChart = bigMacGlobals.getScatterChart();

  if (thisChart !== undefined) {
    // Exists: update only
    updateScatterChart(dsIndex, topIndex, pathID);
  } else {
    // Doesn't exist: build it
    if (buildScatterChart()) {
      updateScatterChart(dsIndex, topIndex, pathID);
    }
  }
}

// DRAW LINE CHART

