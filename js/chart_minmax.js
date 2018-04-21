/*jslint white: true, indent: 2, sloppy: true, plusplus: true */
/**
 * Potential library function
 */

// MAKE MIN MAX OBJECT
// Called from ***ALL*** chart components
// Passed 3 args: actual min val; actual max val; ideal number of increment-steps
// Returns obj with 3 properties: min, max, increment
function makeMinMaxObject(minV, maxV, stepV) {
  var mmObj, min, max, incr, plausibleVals, pv, i;
  
  mmObj = {};
  // Array of "acceptable" increments
  plausibleVals = model.charts.plausible_values;
  min = 0;
  max = 0;
    
  // Min can't exceed zero; max can't be less than zero
  minV = Math.min(0, minV);
  maxV = Math.max(0,maxV);
  // Do (max-min) / steps to get a raw increment
  incr = (maxV - minV) / stepV;
      
  // Increment is presumably imperfect, so loop through
  // the array of values, raising the increment 
  // to the next acceptable value
  for (i = 0; i < plausibleVals.length; i ++) {
    pv = plausibleVals[i];
    if (pv >= incr) {
      incr = pv;
      break;
    }
  }

  // From zero, lower min to next acceptable value on or below inherited min
  while (Math.floor(min) > Math.floor(minV)) {
    min -= incr;
  }
  // From zero, raise max to next acceptable value on or above inherited max
  while (max < maxV) {
    max += incr;
  }
  
  mmObj.min = min;
  mmObj.max = max;
  mmObj.increment = incr;
  
  return mmObj;
}
// MAKE MIN MAX OBJECT ends

