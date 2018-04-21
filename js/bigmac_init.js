/*jslint sloppy:true, plusplus:true */
/*global $, bigMacGlobals, Econ, model, window, topicButtonClick, regionListClick, resetZoom, startupMediator */
//Drupal.behaviors.interactiveFeatures = function(context) {
$(document).ready(function(){
  // Are we on a touch based device?.
  bigMacGlobals.setDeviceFlag(Econ.isTouchDevice());
  // Set IE flag. Although I hate this, there is no way for us to use feature detection for some features.
  // So we have to detect the browser instead.
  bigMacGlobals.setExplorerFlag(navigator.appName.search("Explorer") >= 0);
  //bigMacGlobals.setExplorerFlag(true);  

  // CSS transitions support.
  var cssTransitions = $('.csstransitions').length;

  // Create the navigation tab system.
  function createTabs (tabs) {
    var tabMenu, tabMenuChild, tabMenuChildren, childClass, s, i, x, zoomMenuChild, cMenuChild,
      currencies, zoomRegions, modelStrings, zoomMenu, currencyMenu;
    tabMenuChild = '';

    // Build tabs and sub-menus.
    for (s in tabs) {
      if (tabs.hasOwnProperty(s)) {
        i = 0;
        tabMenuChildren = '';
        childClass = 'has-nochild';
        if (!Econ.isEmptyObject(tabs[s].children)) {
          childClass = 'has-child';
          tabMenuChildren = '<ul>';
          for (x in tabs[s].children) {
            if (tabs[s].children.hasOwnProperty(x)) {
              tabMenuChildren += '<li>' + tabs[s].children[i] + '</li>';
              i++;
            }
          }
          tabMenuChildren += '</ul>';
       }
        tabMenuChild +=  '<li class="' + childClass + '"><span>' + tabs[s].label + '</span>' + tabMenuChildren + '</li>';
      }
    }
    return '<ul class="topic-menu-nav">' + tabMenuChild + '</ul>';
  }

  // Create the zoom menu.
  function createZoom(zoomRegions) {
    var y, css;
    zoomMenuChild = '';
    for (y in zoomRegions) {
      if (zoomRegions.hasOwnProperty(y)) {
        zoomMenuChild += '<li id="' + y + '">' + zoomRegions[y].display + '</li>';
      }
    }
    if (bigMacGlobals.getExplorerFlag()) {
      css = 'style="display: none;"';
    }
    return '<div class="map-zoom"><span>Zoom to</span><ul ' + css + '>' + zoomMenuChild + '</ul></div>';
  }

  // Create the base currencies menu.
  function createCurrencyMenu(currencies) {
    var y, defaultCurrencyLabel, i, css;
    i = model.flags.currency_index;
    defaultCurrencyLabel = currencies[i].name;
    cMenuChild = '';
    for (y in currencies) {
      if (currencies.hasOwnProperty(y)) {
        cMenuChild += '<li id="' + y + '">' + currencies[y].name + '</li>';
      }
    }
    if (bigMacGlobals.getExplorerFlag()) {
      css = 'style="display: none;"';
    }
    return '<div class="currency-dropdown"><span>' + defaultCurrencyLabel + '</span><ul ' + css + '>' + cMenuChild + '</ul></div>';
  }
  
  // Menu hiding.
  function hideMenu(menu) {
    if (!cssTransitions) {
      // Jquery.
      $('ul', menu).slideUp(10);
    }
    else {
      // CSS3 transitions.
      menu.removeClass('show-menu');
    }
  }
  
  // Initialise array of filtered datasets
  function makeDataProvidersArray() {
    var dCount = getLastDataset();
    bigMacGlobals.initialiseDataProvider(dCount);
  }

  tabs = model.topic_menu;
  currencies = model.currencies;
  // Zooms
  /*    There's an assumption here that zooms for ALL maps are defined in
   *    first map. A minor tweak would allow us to make zooms map-specific,
   *    associated with map index...
   */
  zoomRegions = window.map0.zooms;
  // For future reference...
  model.zoomRegions = zoomRegions;
  modelStrings = model.strings;
  
  // Build tabs and sub-menus.
  tabMenu = createTabs(tabs);
  // Build zoom dropdown.
  zoomMenu = createZoom(zoomRegions);
  // Build currency dropdown.
  currencyMenu = createCurrencyMenu(currencies);
  
  // Create the HTML structure, starting with inner wrappers (c is source/footnotes).
  $('#bigmac-wrapper')
    .append('<div class="inner-wrapper-a"></div>')
    .append('<div class="inner-wrapper-b"></div>')
    .append('<div class="inner-wrapper-c"></div>');
    // No notes, so inner wrapper d comm'd out
    // .append('<div class="inner-wrapper-d"><h4></h4></div>');

  // Left (2 cols) wrapper: title, currencies dropdown, topic bar, map, zoom menu, reset button...
  $('.inner-wrapper-a')
    .append(' <div class="title-canvas"><h2>' + modelStrings.title_string + '</h2></div>')
    .append(' <div class="topic-canvas"></div>')
    .append('<div id="bigmac-map"></div>')
    .append('<div class="titles"><p class="map-title">To come</p><p class="map-subtitle">To come</p></div>')
    .append(zoomMenu)
    .append(' <span class="reset-btn">Reset</span>')
    .append(' <div class="key-box"></div>')
    .append(' <div class="info-box"><h2></h2><h3></h3><div class="info-body"></div></div>') 
    .append(' <div id="line-scatter-chart-div"></div>'); 

  // Source and footnote
  $('.inner-wrapper-c')
    .append('<p class="source-p">' + modelStrings.source + '</p>')
    .append('<p class="footnote-p">' + modelStrings.footnote + '</p>');
  
  // Topic canvas: base-currency and topic menu systems
  $('.topic-canvas')
    .append(' <div class="currency-canvas"><h2>' + modelStrings.currency_string + '</h2>' + currencyMenu + '</div>')
    .append(tabMenu);

  // Div containing line and scatter charts: title & subtitle; 2 divs as Highchart containers
  $('#line-scatter-chart-div')
    .append('<h2>Country name</h2><h3>subtitle to come</h3>')
    .append('<div id="line-canvas"></div>')
    .append('<div id="scatter-canvas">Scatter chart appears here... and should be default</div>')
    ;
    // Line chart defaults to hidden:
    $('#line-canvas').addClass('hide-chart');

  // Right (1 col) wrapper: bar chart & general mode d'emploi...
  // ('barchart-box' must be *id* for Highcharts to find the component)  
  $('.inner-wrapper-b')
    .append('<div id="barchart-box"></div>');
        
  // Big Mac has a complex key box, split into three divs;
  // set up basic structure:
  $('.key-box')
    .append('<div class="key-sub-left"><h2>Undervalued by:</h2></div>')
    .append('<div class="key-sub-centre"><ul class="map-keys"></ul></div>')
    .append('<div class="key-sub-right"><h2>Overvalued by:</h2></div>');
    
  // IE: get at key font sizes
  if (bigMacGlobals.getExplorerFlag()) {
    $('.key-box .key-sub-left h2').css('font-size', '9px');
    $('.key-box .key-sub-right h2').css('font-size', '9px');
    $('.key-box .key-sub-centre').css('font-size', '9px');
    // No: elements don't exist yet...
    // $('.map-keys li').css('font-size', '9px');
  }
  
  // Set the selected elements.
  // TO DO: this assumes, I think, that the first topic menu item is the default
  // This isn't necessarily the case...
  $('> li:first-child', $('.topic-menu-nav')).addClass('selected');

  // Set events on menu drop-downs.
  // Mouse over/out on topic menu tabs and zoom button shows/hides dropdowns.
  $('.topic-menu-nav > li.has-child, .map-zoom, .currency-dropdown').hover(function () {
      if (cssTransitions) {
        $(this).addClass('show-menu');
      }
      else {
        // Show its submenu.
        $('ul', $(this)).slideDown(200);
      }
    },
    function () {
      if (cssTransitions) {
        $(this).removeClass('show-menu');
      }
      else {
        // Hide its submenu.
        $('ul', $(this)).css('display', 'none');
      }
    });

  // Topic menu click.
  $('.topic-menu-nav li:not(.has-child)').click(function () {
    hideMenu($('.topic-menu-nav li'));
    var $this, getParentIndex, $thisElm;
    $this = $(this);
    // Get the index of the li element.
    getParentIndex = $('.topic-menu-nav li:not(".has-child")').index(this);
    $('.topic-menu-nav li, .topic-menu-nav li.has-nochild').removeClass('selected');
    $thisElm = ($this.hasClass('has-nochild')) ?  $this : $this.parents('li');
    $thisElm.addClass('selected');
    topicButtonClick(getParentIndex);
  });
  
  // Zoom click.
  $('.map-zoom li').click(function () {
    var regionID = $(this).attr('id');
    hideMenu($('.map-zoom'));
    regionListClick(regionID);
  });
  $('.reset-btn').click(function () {
    resetZoom();
  });

  // Currencies click.
  $('.currency-dropdown li').click(function () {
    var currencyIndex = $(this).attr('id');
    hideMenu($('.currency-dropdown'));
    //Pass as number:
    baseCurrencyButtonClick(parseInt(currencyIndex, 10));
  });
  
  makeDataProvidersArray();
  
  // Get the show on the road
  if ($('#bigmac-wrapper').length) {
    startupMediator();
  }
});

// DC USER PREFS
// Sets a default height (which can be overridden by chart-specific metadata)
// and a trendline colour
var dcUserPrefs = {  
  // LAYOUT:
  layout : {
    outer_wrapper_height : '600px',
    trendline_color: '#762B19'    // magenta
    //trendline_color: '#00928A'    // green
  },
  // LAYOUT ends.
};