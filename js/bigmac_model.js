/*jslint devel: true, plusplus: true, sloppy: true */

// All "global" vars wrapped inside an object.
// Note three separate vars holding last chart path object, colour and id.
// Also note separate map- and chart-dataProviders
var bigMacGlobals = (function(){
  var barChart, lineChart, scatterChart, lastChartPoint, deviceFlag = false, currentID = "",
    explorerFlag = false, rPaper, defaultViewBox, currentViewBox, pathNameArray, textSet, lastMapColor = '#fff',
    frozen = false, rawDataProvider, filteredDataProvider, dataProvider=[], barChartProvider=[];

  return {

    // TWO CHART OBJECTS
    setBarChart: function(myO){
      barChart = myO;
    },
    getBarChart: function(){
      return barChart;
    },
    setLineChart: function(myO){
      lineChart = myO;
    },
    getLineChart: function(){
      return lineChart;
    },
    setScatterChart: function(myO){
      scatterChart = myO;
    },
    getScatterChart: function(){
      return scatterChart;
    },

    // LAST_CHART_POINT holds previous chart obj (for devices)
    setLastChartPoint: function(cPt){
      lastChartPoint = cPt;
    },
    getLastChartPoint: function(){
      return lastChartPoint;
    },

    // Boolean DEVICEFLAG flags up touch-screen
    setDeviceFlag: function(myB){
      deviceFlag = myB;
    },
    getDeviceFlag: function(){
      return deviceFlag;
    },

    // CURRENTID holds current "country/state" id string (eg "GBR")
    setCurrentID: function(id){
      currentID = id;
    },
    getCurrentID: function(){
      return currentID;
    },

    // Boolean EXPLORERFLAG flags browser=IE
    setExplorerFlag: function(myB){
      explorerFlag = myB;
    },
    getExplorerFlag: function(){
      return explorerFlag;
    },

    // RPAPER refers to Raphael paper
    setPaper: function(p){
      rPaper = p;
    },
    getPaper: function(){
      return rPaper;
    },

    // DEFAULTVIEWBOX : default Raphael ViewBox
    setDefaultViewBox: function(vb){
      defaultViewBox = vb;
    },
    getDefaultViewBox: function(){
      return defaultViewBox;
    },

    // CURRENTVIEWBOX : current Raphael ViewBox
    setCurrentViewBox: function(vb){
      currentViewBox = vb;
    },
    getCurrentViewBox: function(){
      return currentViewBox;
    },

    // PATHNAMEARRAY: array of active path ids
    setPathNameArray: function(a){
      pathNameArray = a;
    },
    getPathNameArray: function(){
      return pathNameArray;
    },

    // TEXTSET : Raphael group of text objects
    setTextSet: function(a){
      textSet = a;
    },
    getTextSet: function(){
      return textSet;
    },

    // LASTMAPCOLOR: prev map color
    setLastMapColor: function(a){
      lastMapColor = a;
    },
    getLastMapColor: function(){
      return lastMapColor;
    },

    // FROZEN is path click flag (!devices), to allow user to roll over chart...
    // (if frozen is true, user can leave map without the highlight being lost)
    setFrozen: function(b){
      frozen = b;
    },
    getFrozen: function(){
      return frozen;
    },

    // DATA PROVIDERS: arrays of raw & filtered data for maps & charts
    setDataProvider: function(i, dSet){
      dataProvider[i] = dSet;
    },
    getDataProvider: function(i){
      return dataProvider[i];
    },
    setBarChartProvider: function(i, dSet){
      barChartProvider[i] = dSet;
    },
    getBarChartProvider: function(i){
      return barChartProvider[i];
    },
    initialiseDataProvider: function(i){
      dataProvider.len = i;
      barChartProvider.len = i;
    }

  };
}());
// BIG MAC GLOBALS ends


// BIG MAC MODEL
var model = {

  // LAYOUT: path and text default styles
  layout : {
    // DEFAULT PATH STYLES: frames; ocean; "inactive" and default paths; rollover highlight
    path_styles : {
      frame : {
        // Style for on-map separators (eg Orkneys/Shetlands);
        // or pull-outs for small countries/states (Washington DC)
        name : "frame",
        strokeWeight : 1,
        strokeColor : "#444444"
      },
      ocean : {
        name : 'ocean',
        strokeWeight: 0,
        strokeColor: '#FFFFFF',
        fillColor : '#FFFFFF'
      },
      inactive : {
        // Style applied to any path for which there is no matching data
        // (This is applied to all paths when map is initially loaded)
        name : "inactive",
        strokeWeight : 0,
        strokeColor : "#EEEEEE",
        fillColor : "#EEEEEE",
        fillAlpha : 1,
        lineJoin : 'round'
      },
      active_default : {
        // Default attributes for active paths. Stroke weight and colour
        // are applied when active path fills are recoloured. Other attribs redundant
        // (NB "default" is a reserved name)
        name : "active_default",
        strokeWeight : 1,
        strokeColor : "#FFFFFF",
        fillColor : "#FFFFFF",
        fillAlpha : 1,
        lineJoin : 'round'
      },
      rollover : {
        // Style for map rollover
        // Stroke weight/color are for all except IE, which sets a fill
        // to avoid having to do a toFront()...
        name : "rollover",
        strokeWeight : 2,
        strokeColor : "#BF0000",     //'#79D3F6',  //"#FF3399",    //"#009ECC",
        fill : "#BF0000"
      }
    },
    // TEXT
    text_style : {
      font : 'Arial',
      'font-size' : 14,
      fill : '#000000',
      // text-anchor values are 'start', 'middle', 'end' or 'inherit'
      'text-anchor' : 'start',
      'pointer-events' : 'none'
    },
    colours: {
      lineChartPlotBands: "#EFEFEF"
    }
  },
  // LAYOUT ends

  // ZOOM
  // Sets number of zoom increments
  zoom : {
    zoomCount : 20
  },
  // ZOOM ends

  // CALCULATION
  // Any prefs I need for calculations
  // Initially, just the flag for what sort of comparison to do for heatmap/chart colours
  calculation : {
    // compare constants are: "LESS_EQUAL"
    //  to come: LESS, EQUAL, EQUAL_MORE, MORE and, possibly, BETWEEN
    colour : {
      compare : "LESS"
    }
  },

  // STRINGS
  // General, not topic-specific...
  strings : {
    title_string : "The Big Mac index",
    currency_string : "Select base currency:",
    source : "Sources: McDonald's; Thomson Reuters; IMF; <i>The Economist</i>",
    footnote : "",
    extra_key : null,
    defaultID: "OCEAN",
    shortMonths: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    longMonths: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    image_path: "images/",
    image_extension: ".png",
    scatter_title: "Big Mac prices v GDP per person",
    scatter_subtitle: "Latest",
    scatter_raw_suffix: ", raw index",
    scatter_adjusted_suffix: ", adjusted for GDP per person",
    scatter_footnote: "*At market exchange rate",
    line_subtitle: "Under(–)/over(+) valuation against ",
    // X-title for scatter uses "currencysymbot" as substitute-string for actual currency
    // ***    IMPORTANT: DATE IS HARD-CODED HERE AND UPDATES EVERY YEAR OR SO... ***
    scatterXTitle: "GDP per person, 2016, currencysymbol'000",
    scatterYTitle: "Big Mac price*, ",
    keyPrefix: "key_",
    indiaFootNote: ".  India's <i>Maharaja Mac</i> is made of chicken",
    venezuelaFootNote: ". 2015-17 actual ex-rate: SIMADI/DICOM rate",
    vietnamFootNote: ".  Vietnam added February 10th 2014",
    euroareaFootNote: ".  Weighted average of member countries"
  },
  // STRINGS ends

  // FLAGS and DEFAULT FLAGS: topicIndex, currencyIndex, datasetIndex, mapIndex, categoryID
  //    (nb: categoryID is ***chart*** category)
  // FLAGS are the current settings. These are initially set to whacky values
  //    to force update
  // DEFAULT FLAGS may be redundant...
  // Note that indices are zero-based
  flags : {
    topic_index : 0,
    currency_index: 4,
    dataset_index : 27,
    map_index : 100,
    category_id : ""
  },
  default_flags : {
    // I think the first three are redundant: we only need the
    // map_index, for the comparison in the controller, upon startup...
    //topic_index : 0,
    //currency_index: 0,
    //dataset_index : 0,
    map_index: 0
  },
  // DEFAULT FLAGS end

  // TOPICS
  /* "look_up" node allows us to refer to other topics by index...
   long_name appears as map title
   subtitle is currently map subtitle (I'm assuming chart has none, so far...)
   *** Do I need an info_string, which is the topic title ("Production") in info box
   info prefix/suffix handles "$bn2.5" or "3.4bn"
   chart_val_factors left in as a reminder that I might need them
   info_factor is multiplier of value for display in info box (not on import; see elsewhere...)
   info_extraheight is amount to increase height of info box
   info_precision is number of DPs to display in info box
   source and footnote are topic-specific strings
   TO DO: I'll need a flag that tells me to use topic-specific sources/footnotes
   rather than general...
   */
  topics : {
    tabs: {
      basic : {
        id : "basic",
        long_name : "Raw index",
        title : "Raw index",
        // 'base' in subtitle is target for specific-currency name substitution
        subtitle : "Under(–)/over(+) valuation against base, %",
        info_prefix : "",
        info_suffix : "",
        chart_val_factor_state: 1000000,
        chart_val_factor_national: 1000000,
        chart_incr_steps: 6,
        info_factor : 1,
        info_extraheight : 0,
        info_precision : 1,
        source : "",
        footnote : "*Local price divided by % price"
      },
      adjusted : {
        id : "adjusted",
        long_name : "Adjusted index",
        title : "Index adjusted for GDP per person",
        subtitle : "Under(–)/over(+) valuation against base, %",
        info_prefix : "",
        info_suffix : "",
        chart_val_factor_state: 1,
        chart_val_factor_national: 1,
        chart_incr_steps: 6,
        info_factor : 1,
        info_extraheight : 0,
        info_precision : 1,
        source : "",
        footnote : ""
      }
    },
    // LOOK UP is a numbered list of topic ids, for reference by index
    look_up : {
      0 : "basic",
      1 : "adjusted"
    }
  },  // TOPICS end

  // DATASETS
  // Matches map index to dataset. And sets date and dataset name for each.
  // Note that 'date' must be in format: 'd Mmmm yyyy', even if the specific date is arbitrary...
  //    'd' is stripped out for display
  datasets : {
    0 : {
      map_index : 0,
      date : "15 April 2000",
      dataset : "Apr2000"
    },
    1 : {
      map_index : 0,
      date : "15 April 2001",
      dataset : "Apr2001"
    },
    2 : {
      map_index : 0,
      date : "15 April 2002",
      dataset : "Apr2002"
    },
    3 : {
      map_index : 0,
      date : "15 April 2003",
      dataset : "Apr2003"
    },
    4 : {
      map_index : 0,
      date : "15 May 2004",
      dataset : "May2004"
    },
    5 : {
      map_index : 0,
      date : "15 June 2005",
      dataset : "Jun2005"
    },
    6 : {
      map_index : 0,
      date : "15 January 2006",
      dataset : "Jan2006"
    },
    7 : {
      map_index : 0,
      date : "15 May 2006",
      dataset : "May2006"
    },
    8 : {
      map_index : 0,
      date : "15 January 2007",
      dataset : "Jan2007"
    },
    9 : {
      map_index : 0,
      date : "15 June 2007",
      dataset : "Jun2007"
    },
    10 : {
      map_index : 0,
      date : "15 June 2008",
      dataset : "Jun2008"
    },
    11 : {
      map_index : 0,
      date : "15 July 2009",
      dataset : "Jul2009"
    },
    12 : {
      map_index : 0,
      date : "15 January 2010",
      dataset : "Jan2010"
    },
    13 : {
      map_index : 0,
      date : "15 July 2010",
      dataset : "Jul2010"
    },
    14 : {
      map_index : 0,
      date : "15 July 2011",
      dataset : "Jul2011"
    },
    15 : {
      map_index : 0,
      date : "15 January 2012",
      dataset : "Jan2012"
    },
    16 : {
      map_index : 0,
      date : "15 July 2012",
      dataset : "Jul2012"
    },
    17 : {
      map_index : 0,
      date : "15 January 2013",
      dataset : "Jan2013"
    },
    18 : {
      map_index : 0,
      date : "15 July 2013",
      dataset : "Jul2013"
    },
    19 : {
      map_index : 0,
      date : "15 January 2014",
      dataset : "Jan2014"
    },
    20 : {
      map_index : 0,
      date : "15 July 2014",
      dataset : "Jul2014"
    },
    21 : {
      map_index : 0,
      date : "15 January 2015",
      dataset : "Jan2015"
    },
    22 : {
      map_index : 0,
      date : "15 July 2015",
      dataset : "Jul2015"
    },
    23 : {
      map_index : 0,
      date : "15 January 2016",
      dataset : "Jan2016"
    },
    24 : {
      map_index : 0,
      date : "15 July 2016",
      dataset : "Jul2016"
    },
    25 : {
      map_index : 0,
      date : "15 January 2017",
      dataset : "Jan2017"
    },
    26 : {
      map_index : 0,
      date : "15 July 2017",
      dataset : "Jul2017"
    },
    27 : {
      map_index : 0,
      date : "15 January 2018",
      dataset : "Jan2018"
    }
  },
  // DATASETS end

  // LINE CHART MIN DATASET COUNT is the minimum number of years
  // for which we need data for a country to display a line chart...
  linechartMinPoints: 3,

  // CHART TO DATASET
  // Reverse lookup, for chart rollover to match date to dataset
  chart_to_dataset : {
    'Apr2000':0,
    'Apr2001':1,
    'Apr2002':2,
    'Apr2003':3,
    'May2004':4,
    'Jun2005':5,
    'Jan2006':6,
    'May2006':7,
    'Jan2007':8,
    'Jun2007':9,
    'Jun2008':10,
    'Jul2009':11,
    'Jan2010':12,
    'Jul2010':13,
    'Jul2011':14,
    'Jan2012':15,
    'Jul2012':16,
    'Jan2013':17,
    'Jul2013':18,
    'Jan2014':19,
    'Jul2014':20,
    'Jan2015':21,
    'Jul2015':22,
    'Jan2016':23,
    'Jul2016':24,
    'Jan2017':25,
    'Jul2017':26,
    'Jan2018':27
  },
  // CHART TO DATASET ends

  // MAP COLOURS
  // TO DO: this presumably still needs the constant that tells us how
  // to calculate: LESS_THAN, LESS_OR_EQUAL, EQUAL, MORE_OR_EQUAL, MORE_THAN
  // NB: charts use same colours
  // NB ALSO: key strings shortened and put on one line. Comm'd out are original, longer versions
  mapColours : {
    basic : {
      length : 7,
      compare: "LESS_EQUAL",
      colours : {
        1 : {
          value : -50,
          colour : "#E63F2E",     // "#E9433A",
          display : ">50%"
        },
        2 : {
          value : -25,
          colour : "#E38C76",     // "#F48A7A",
          display : "25-50%"
        },
        3 : {
          value : -10,
          colour : "#FFB39C",     // "#FBB7AF",
          display : "10-25%"
        },
        4 : {
          value : 10,
          colour : "#E6DA96",     // "#F2E6B2",
          display : "–/+&nbsp;10%"
        },
        5 : {
          value : 50,
          colour : "#BACFD8",     // "#A3D5A9",
          display : "10-50%"
        },
        6 : {
          value : 100,
          colour : "#649AA7",     // "#49B46A",
          display : "50-100%"
        },
        7 : {
          value : 1000000,
          colour : "#16526D",     // "#007E3E",
          display : ">100%"
        }
      }
    },
    adjusted : {
      length : 7,
      compare: "LESS_EQUAL",
      colours : {
        1 : {
          value : -50,
          colour : "#E63F2E",     // "#E9433A",
          display : "50%&nbsp;+"
        },
        2 : {
          value : -25,
          colour : "#E38C76",     // "#F48A7A",
          display : "25%&nbsp;+"
        },
        3 : {
          value : -10,
          colour : "#FFB39C",     // "#FBB7AF",
          display : "10%&nbsp;+"
        },
        4 : {
          value : 10,
          colour : "#E6DA96",     // "#F2E6B2",
          display : "+/-&nbsp;10%"
        },
        5 : {
          value : 50,
          colour : "#BACFD8",     // "#A3D5A9",
          display : "10%&nbsp;+"
        },
        6 : {
          value : 100,
          colour : "#649AA7",     // "#49B46A",
          display : "50%&nbsp;+"
        },
        7 : {
          value : 1000000,
          colour : "#16526D",     // "#007E3E",
          display : "100%&nbsp;+"
        }
      }
    },
    lookup: {
      0: 'basic',
      1: 'adjusted'
    }
  },
  // MAP COLOURS ends

  // CHARTS
  // Chart-specific
  // Initially, just a threshold
  charts : {
    // Display threshold: if flag=true, values are only displayed above(true)/below(false)
    // the value declared. Initially used to prevent zero results appearing on the
    // Global Nuclear Power project
    display_threshold : {
      flag : false,
      above : true,
      value : 0
    },
    // Exclusions should be a comma-separated list of IDs
    // that should be omitted from the chart...
    exclusions : "",
    plausible_values : [0.25,0.5,1,2,3,5,10,20,25,50,100,200,500,1000,2000],
    // Big Mac specific: prevents line chart displaying on adjusted index; reset to true when we've got a few values to play with...
    showLineForAdjusted: false,
    highlightFill: "#FF0000"
  },
  // CHARTS ends

  // TOPIC MENU
  topic_menu : {
    0: {
      label: "Raw index",
      children: {}
    },
    1: {
      label: "Adjusted index",
      children: {}
    }
  },
  // TOPIC MENU ends.

  // CURRENCIES
  //    id is for internal x-ref and may be redundant
  //    countryID x-refs to node where I find BM price in base currency
  //    rate is field-label for XR against base currency
  //    adjusted is field-label for adjusted price against base currency --
  //      I'm not sure if I get this with the data or work it out on the fly...
  currencies: {
    0: {
      id: "yuan",
      countryID: "CHN",
      rate: "yuan_ex",
      name: "Chinese yuan",
      display: "the yuan",
      gdp: "GDP_yuan",
      adjusted: "GDP_adj_yuan_price",
      symbol: "Yuan "
    },
    1: {
      id: "euro",
      countryID: "EUR",
      name: "Euro",
      display: "the euro",
      rate: "euro_ex",
      gdp: "GDP_euro",
      adjusted: "GDP_adj_euro_price",
      symbol: "€"
    },
    2: {
      id: "yen",
      countryID: "JPN",
      name: "Japanese yen",
      display: "the yen",
      rate: "yen_ex",
      gdp: "GDP_yen",
      adjusted: "GDP_adj_yen_price",
      symbol: "¥"
    },
    3: {
      id: "sterling",
      countryID: "GBR",
      name: "Sterling",
      display: "sterling",
      rate: "sterling_ex",
      gdp: "GDP_sterling",
      adjusted: "GDP_adj_sterling_price",
      symbol: "£"
    },
    4: {
      id: "dollar",
      countryID: "USA",
      name: "US dollar",
      display: "the dollar",
      gdp: "GDP_dollar",
      rate: "dollar_ex",
      adjusted: "GDP_adj_dollar_price",
      symbol: "$"
    }
  },
  // CURRENCIES ends

  // COUNTRIES is a lookup (that might, arguably, want to live in a separate file on the server)
  // and associates country IDs, names and currency-names
  countries: {
  ARG:
      {
      id: 'ARG',
      name: 'Argentina',
      currency: 'Peso'
      },

  AUS:
      {
      id: 'AUS',
      name: 'Australia',
      currency: 'A$'
      },

  AUT:
      {
      id: 'AUT',
      name: 'Austria',
      currency: 'Schilling'
      },

  BEL:
      {
      id: 'BEL',
      name: 'Belgium',
      currency: 'Franc'
      },

  BRA:
      {
      id: 'BRA',
      name: 'Brazil',
      currency: 'Real'
      },

  GBR:
      {
      id: 'GBR',
      name: 'Britain',
      currency: '£'
      },

  CAN:
      {
      id: 'CAN',
      name: 'Canada',
      currency: 'C$'
      },

  CHL:
      {
      id: 'CHL',
      name: 'Chile',
      currency: 'Peso'
      },

  CHN:
      {
      id: 'CHN',
      name: 'China',
      currency: 'Yuan'
      },

  COL:
      {
      id: 'COL',
      name: 'Colombia',
      currency: 'Peso'
      },

  CRI:
      {
      id: 'CRI',
      name: 'Costa Rica',
      currency: 'Colones'
      },

  CZE:
      {
      id: 'CZE',
      name: 'Czech Republic',
      currency: 'Koruna'
      },

  DNK:
      {
      id: 'DNK',
      name: 'Denmark',
      currency: 'DK'
      },

  EGY:
      {
      id: 'EGY',
      name: 'Egypt',
      currency: 'Pound'
      },

  EST:
      {
      id: 'EST',
      name: 'Estonia',
      currency: 'Kroon'
      },

  EUR:
      {
      id: 'EUR',
      name: 'Euro area',
      currency: '€'
      },

  FIN:
      {
      id: 'FIN',
      name: 'Finland',
      currency: 'Markka'
      },

  FRA:
      {
      id: 'FRA',
      name: 'France',
      currency: 'Franc'
      },

  DEU:
      {
      id: 'DEU',
      name: 'Germany',
      currency: 'Mark'
      },

  GRC:
      {
      id: 'GRC',
      name: 'Greece',
      currency: 'Drachma'
      },

  HKG:
      {
      id: 'HKG',
      name: 'Hong Kong',
      currency: 'HK$'
      },

  HUN:
      {
      id: 'HUN',
      name: 'Hungary',
      currency: 'Forint'
      },

  // ISL:
      // {
      // id: 'ISL',
      // name: 'Iceland',
      // currency: 'Krona'
      // },

  IND:
      {
      id: 'IND',
      name: 'India',
      currency: 'Rupee'
      },

  IDN:
      {
      id: 'IDN',
      name: 'Indonesia',
      currency: 'Rupiah'
      },

  IRL:
      {
      id: 'IRL',
      name: 'Ireland',
      currency: 'Punt'
      },

  ISR:
      {
      id: 'ISR',
      name: 'Israel',
      currency: 'Shekel'
      },

  ITA:
      {
      id: 'ITA',
      name: 'Italy',
      currency: 'Lira'
      },

  JPN:
      {
      id: 'JPN',
      name: 'Japan',
      currency: '¥'
      },

  LVA:
      {
      id: 'LVA',
      name: 'Latvia',
      currency: 'Lats'
      },

  LTU:
      {
      id: 'LTU',
      name: 'Lithuania',
      currency: 'Litas'
      },

  MYS:
      {
      id: 'MYS',
      name: 'Malaysia',
      currency: 'Ringgit'
      },

  MEX:
      {
      id: 'MEX',
      name: 'Mexico',
      currency: 'Peso'
      },

  NLD:
      {
      id: 'NLD',
      name: 'Netherlands',
      currency: 'Guilder'
      },

  NZL:
      {
      id: 'NZL',
      name: 'New Zealand',
      currency: 'NZ$'
      },

  NOR:
      {
      id: 'NOR',
      name: 'Norway',
      currency: 'Kroner'
      },

  PAK:
      {
      id: 'PAK',
      name: 'Pakistan',
      currency: 'Rupee'
      },

  PER:
      {
      id: 'PER',
      name: 'Peru',
      currency: 'Sol'
      },

  PHL:
      {
      id: 'PHL',
      name: 'Philippines',
      currency: 'Peso'
      },

  POL:
      {
      id: 'POL',
      name: 'Poland',
      currency: 'Zloty'
      },

  RUS:
      {
      id: 'RUS',
      name: 'Russia',
      currency: 'Rouble'
      },

  SAU:
      {
      id: 'SAU',
      name: 'Saudi Arabia',
      currency: 'Riyal'
      },

  SGP:
      {
      id: 'SGP',
      name: 'Singapore',
      currency: 'S$'
      },

  // SVK:
      // {
      // id: 'SVK',
      // name: 'Slovakia',
      // currency: 'Koruna'
      // },
//
  // SVN:
      // {
      // id: 'SVN',
      // name: 'Slovenia',
      // currency: 'Tolar'
      // },

  ZAF:
      {
      id: 'ZAF',
      name: 'South Africa',
      currency: 'Rand'
      },

  KOR:
      {
      id: 'KOR',
      name: 'South Korea',
      currency: 'Won'
      },

  SOV:
      {
      id: 'SOV',
      name: 'Soviet Union',
      currency: 'Rouble'
      },

  PRT:
    {
    id: 'PRT',
    name: 'Portugal',
    currency: 'Escudo'
    },

  ESP:
      {
      id: 'ESP',
      name: 'Spain',
      currency: 'Peso'
      },

  LKA:
      {
      id: 'LKA',
      name: 'Sri Lanka',
      currency: 'Rupee'
      },

  SWE:
      {
      id: 'SWE',
      name: 'Sweden',
      currency: 'SKr'
      },

  CHE:
      {
      id: 'CHE',
      name: 'Switzerland',
      currency: 'SFr'
      },

  TWN:
      {
      id: 'TWN',
      name: 'Taiwan',
      currency: 'NT$'
      },

  THA:
      {
      id: 'THA',
      name: 'Thailand',
      currency: 'Baht'
      },

  TUR:
      {
      id: 'TUR',
      name: 'Turkey',
      currency: 'Lira'
      },

  ARE:
      {
      id: 'ARE',
      name: 'UAE',
      currency: 'Dirhams'
      },

  UKR:
      {
      id: 'UKR',
      name: 'Ukraine',
      currency: 'Hryvnia'
      },

  USA:
      {
      id: 'USA',
      name: 'United States',
      currency: '$',
      note: "A useful note, unhelpfully stuck in the model, telling us something about the USA..."
      },

  URY:
      {
      id: 'URY',
      name: 'Uruguay',
      currency: 'Peso'
      },

  VEN:
      {
      id: 'VEN',
      name: 'Venezuela',
      currency: 'Bolivar'
      },

  VNM:
      {
      id: 'VNM',
      name: 'Vietnam',
      currency: 'Dong'
      }

  }

};
// BIG MAC MODEL ends
