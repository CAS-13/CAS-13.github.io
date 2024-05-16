// Key sources: 
// https://www.shecodes.io/athena/3469-how-to-display-text-when-a-button-is-clicked-with-javascript
// https://www.washington.edu/accesscomputing/webd2/student/unit5/module2/lesson5.html

function displayText() {
  var text = document.getElementById("about");
  console.log(text);
  var setting = text.style.display;
  console.log(setting);

  if (setting == "block") {
      text.style.display = "none";
  }

  else {
      text.style.display = "block";
  }
  
}