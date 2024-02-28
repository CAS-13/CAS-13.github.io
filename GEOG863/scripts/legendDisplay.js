// Script source: 
// https://www.w3schools.com/css/tryit.asp?filename=trycss3_var_js


// Get the root element
var r = document.querySelector(':root');

// Create a function for getting a variable value
function legendDisplay() {
  // Get the styles (properties and values) for the root
  var rs = getComputedStyle(r);
  if (rs.getPropertyValue('--legend-display') == 'block') {
    r.style.setProperty('--legend-display', 'none');
    document.getElementById("lgdBtn").value = "Show Legend";
  } 
  
  else {
    r.style.setProperty('--legend-display', 'block');
    document.getElementById("lgdBtn").value = "Hide Legend";
  } 
}
