

// Toggles button appearance and value for activity filter
function toggle(buttonID, iconID) {
  let button = document.getElementById(buttonID);
  // let icon = document.getElementById(iconID);
  // let iconCircle = document.getElementById("circle");
  // let paragraph = document.getElementById("test");
  
  if (button.value == "true") {
    button.value = "false";
    button.style.border = "none";
    // paragraph.textContent = "False";
  }

  else {
    button.value = "true";
    button.style.borderBottom = "solid 1px #840032";
    // iconCircle.style.fill="#840032";
    // paragraph.textContent = "True";
  }

};


// Populates "Ward" dropdown in search/filter menu
function populateWards() {
  for (let i=1; i<15; i++) {
    let option = document.createElement("option");
    option.text = i;
    wardSelect.add(option);
  }
};
