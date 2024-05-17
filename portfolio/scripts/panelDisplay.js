// Key sources: 
// https://www.shecodes.io/athena/3469-how-to-display-text-when-a-button-is-clicked-with-javascript
// https://www.washington.edu/accesscomputing/webd2/student/unit5/module2/lesson5.html

function displayPanel() {
  var element = document.getElementById("panel-toggle");
  var setting = element.style.display;

  if (setting == "block") {
      element.style.display = "none";
      document.getElementById("cityBtn").value = "Show City List";
  }

  else {
      element.style.display = "block";
      document.getElementById("cityBtn").value = "Hide City List";
  }
  
}