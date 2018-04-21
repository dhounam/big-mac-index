/*jslint white: true, indent: 2,  sloppy: true, plusplus: true */
/*global window, bigMacGlobals, model, console, $, makeMinMaxObject, Highcharts, barChartMouseOver, barChartMouseOut, chartClick */

// BUILD BAR CHART
// Creates Highcharts chart object.
function buildBarChart() {
  var tempChart, percentA, percentB;

  // CHART definition
  tempChart = new Highcharts.Chart({
    chart : {
      renderTo : 'barchart-box',
      animation: {
        duration: 700,
        easing: 'swing'
      },
      defaultSeriesType : 'bar',
      spacingBottom: 10,
      spacingRight: 20,
      spacingTop: 20,
      marginTop: 60
    },
    // No title or subtitle
    title : {
      align : 'left',
      text : '',
      margin: 100,
      style: {
        color: '#000000',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontWeight : 'bold',
        fontSize : '12px'
      },
      y: 14
    },
    subtitle : {
      align : 'left',
      text : null
    },
    xAxis : {
      categories : ['',''],
      tickWidth: 0,     
      title : {
        text : null
      }
    },
    yAxis : {
      min : 0,
      max : 10,
      tickInterval : 10,
      // offset is distance of labels from plot
      offset: 0,
      opposite : true,
      title : {
        text : null,
        align : 'high'
      }
    },
    tooltip : {
      enabled : false
    },
    legend : {
      enabled : false
    },
    credits : {
      enabled : false
    },
    // Plot options:
    plotOptions : {
      bar : {
        borderColor: '#FF0000',
        borderWidth: 0,
        dataLabels : {
          enabled : false
        },
        stickyTracking : true,
        shadow : false,
        stacking : 'normal',
        states: {
          hover: {
            enabled: false
          }
        }
      },
      // plotOptions.series
      series : {
        cursor : 'pointer',
        // States/hover doesn't reset colour when by-point colouring is imposed.
        // So highlight function is called from event listeners in control.        
        // But setting brightness to zero (visually better; originally to prevent the bug whereby iPad registered hover before
        // click and I 'remember' the brightened colour) 
        states : {
          hover : {
            brightness: 0
          }
        },
        // Point
        point : {
          
          events : {
            mouseOver : function () {
              barChartMouseOver(this);
            },
            mouseOut : function () {
              barChartMouseOut(this);
            },
            click : function () {
              // Click is only registered on devices
              // Do highlighting here, though
              if (bigMacGlobals.getDeviceFlag()) {
                // Highlight "current"bar
                // (Prev'y h'lighted is turned off by fcn)
                highlightChartElement(this.id, true);
                // ...and pass on the event...
                barChartClick(this);
              }
            }
            // Click ends
          }
          // Events ends
        }
        // Point ends
      }
      // plotOptions.series ends
    },
    // Plot options end

    series : [{
      name : "",
      type : 'bar',
      data : [],
      pointWidth : 0
    }]
  });
  // And remember for future updates:
  bigMacGlobals.setBarChart(tempChart);
  return true;
}
// BUILD BAR CHART ends


// UPDATE BAR CHART
// Updates existing bar chart with new data. Note that dsIndex may differ from overall 'map' dataset index
// if chart is updating in response to linechart mouseover.
function updateBarChart(dsIndex) {
  var topIndex, topNode, topID, catStrArray, idArray, seriesArray, sortArray, aLength, s, 
    dataNode, thisID, thisVal, o, id, i, v, c, temp, chartMin, chartMax, chartIncr, barWidth, lastPoint, tempChart, 
    cWidth, cHeight, pHeight, chartObj, chartArray, minMaxObject, chartDataArray,
    uFound, dCount, pCount, myDS, cloneO, tA, tText;
    
    uFound = 0;
    for (dCount = 0; dCount < 6; dCount ++) {
      myDS = bigMacGlobals.getBarChartProvider(dCount);
      if (myDS !== undefined) {
        aLength = myDS.length;
        for (pCount = 0; pCount < aLength; pCount ++) {
          if (myDS[pCount].name === undefined) {
            uFound ++;
          }
        }
      }
    }
    
  tempChart = bigMacGlobals.getBarChart();
  if (tempChart === undefined) {
    alert("Unable to update non-existent chart...");
    return;
  }

  // Title
  tA = model.datasets[dsIndex].date.split(" ");
  tText = tA[1] + " " + tA[2];
  tempChart.setTitle({
    text: tText
  });
  
  topIndex = model.flags.topic_index; 
  // Topic name ("debt") 
  topID = model.topics.look_up[topIndex];
  // Find topic node on model (for min/max/incr)
  topNode = model.topics.tabs[topID];
  
  // Retrieve datasetIndex-specific array of chart-filtered data from global.
  chartDataArray = bigMacGlobals.getBarChartProvider(dsIndex);
  
  /*
   * chartArray is a sorted array of objects, each of which has properties:
   * id, name, value and color (among others).
   * So, in theory, I can throw it straight at HighCharts
   * 
   * But I have to have an array of category strings
   */

  // Length of array
  aLength = chartDataArray.length;  

  // Categories: array of names
  catStrArray = [];
  for (i = 0; i < aLength; i++) {
    
    if (chartDataArray[i].name !== undefined) {
      catStrArray.push(chartDataArray[i].name);
    }
  }

  // Min/max/incr -- fcn in separate component:
  chartMin = chartDataArray[aLength - 1].y;
  minMaxObject = makeMinMaxObject(chartMin, chartDataArray[0].y, topNode.chart_incr_steps);
  chartMin = minMaxObject.min;
  chartMax = minMaxObject.max;
  chartIncr = minMaxObject.increment;
  
  // HERE, MESSING AROUND WITH PASSING BY REFERENCE/VALUE
  cloneO = chartDataArray;
  
  // Chart attributes
  /* IMPORTANT:
   * SET CATEGORIES BEFORE SERIES DATA
   * This is a bug in Highcharts, that surfaces in IE (well, there's a surprise!)
   */
  tempChart.xAxis[0].setCategories(catStrArray, false);
  tempChart.series[0].setData(chartDataArray, false);
  tempChart.yAxis[0].options.tickInterval = chartIncr;
  tempChart.yAxis[0].setExtremes(chartMin, chartMax, false);  
  
  // Get chart and plot dimensions.  
  cWidth = tempChart.chartWidth;
  cHeight = tempChart.chartHeight;
  pHeight = tempChart.plotHeight;
  // IE workaround
  if (pHeight !== undefined) {
    barWidth = Math.round((pHeight / aLength) * 0.75);
    tempChart.series[0].options.pointWidth = barWidth;
  }
  else {
    // If we hit the IE problem, set a hard barwidth.
    tempChart.series[0].options.pointWidth = 15;
  }
  // Force a redraw (setting size preserves bar widths).
  tempChart.setSize(cWidth, cHeight); 
  // Zero line (setting plotline creates a momentary duplicate)
  addZeroLine(tempChart);
  // ...and remember the chart itself.
  bigMacGlobals.setBarChart(tempChart);
  
}

// ADD ZERO LINE
// Draws zero line on bar chart
function addZeroLine(chart) {
    // Adds zero line on top of bars
    var x, bottom;
    // Remove existing renderer
    $("#barZeroRenderer").remove(); 
    // Build new
    x = chart.plotLeft + chart.yAxis[0].translate(0, false);
    bottom = chart.plotTop + chart.plotHeight;
    chart.renderer.path(['M', x, chart.plotTop, 'L', x, bottom])
      .attr({
      'stroke-width': 2,
      stroke: '#FF0000',
      zIndex: 10,
      id: 'barZeroRenderer'
      })
      //.toFront()
      //.css({opacity: 1})
      .add();
}
// ADD ZERO LINE ends
  

// DRAW BAR CHART
// Called from controller. Calls functions to (initially) create
// and (subsequently) update chart...
function drawBarChart(dsIndex) {
  var thisChart;
  
  // Look for this chart. If it exists, it's just updated; otherwise built from the ground up...
  thisChart = bigMacGlobals.getBarChart();
  
  if (thisChart !== undefined) {
    // Exists: update only
    updateBarChart(dsIndex);
  }
  else {
    // Doesn't exist: build it
    if (buildBarChart()) {
      updateBarChart(dsIndex);
    }
  }
}
// DRAW BAR CHART


// HIGHLIGHT CHART ELEMENT
// Highlights element in chart matching current map or linechart emphasis
// Also called from control in response to barchart hover events
// Params are id of path rolled over/clicked; highlight on/off flag;
function highlightChartElement(pName, turnOn) {
  //var mySegment, s, sObj, col;
  var myPoint, lastPoint, highCol, highW, offCol, offW, bTG;
  highCol = model.layout.path_styles.rollover.strokeColor;
  highW = model.layout.path_styles.rollover.strokeWeight;
  offCol = 0;
  offW = 0;
  // Un-highlight (any) previous. This is belt-and-braces for devices...
  if (bigMacGlobals.getDeviceFlag()) {
    lastPoint = bigMacGlobals.getLastChartPoint();
    // Get round issue on devices, where lastPoint comes up null/undefined (catch does nothing):
    try {
      lastPoint.tracker.attr('stroke', offCol);
      lastPoint.tracker.attr('stroke-width', offW);
    }
    catch(err){}
  }
  // Highlight this point
  myPoint = bigMacGlobals.getBarChart().get(pName);
  if (myPoint !== null) {
    bTG = myPoint.tracker;
    if (bTG === undefined) {
      bTG = myPoint.graphic;
    }
    if (turnOn) {
      bTG.attr('stroke', highCol);
      bTG.attr('stroke-width', highW);
    }
    else {
      bTG.attr('stroke', offCol);
      bTG.attr('stroke-width', offW);
    }
      // Remember this bar for next time
      bigMacGlobals.setLastChartPoint(myPoint);
  }
}
// HIGHLIGHT CHART ELEMENT ends

// CHART DISPLAYS
// Checks that individ value crosses chart display threshold
// (eg, that value > 0)
function chartDisplays(v) {
  var result, dt = model.charts.display_threshold;
  // Don't hang about if no threshold set
  if (!dt.flag) {
    return true;
  }
  // Still here? Is threshold above the set value?
  if (dt.above) {
    return (v > dt.value);
  }
  // Still still here? Test 'below' threshold.
  return (v < dt.value);
}

// CHART DISPLAYS ends