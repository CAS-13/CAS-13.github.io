var map;
var wardLabelTiles;
var wardsLayer;
var crashLayer;
var incidentsLayer;

// create incidents Layer and crashLayer symbology at different zoom levels
var colorDict = {
  "navy": "#002642",
  "garnet": "#840032",
  "gold": "#E59500",
  "ltGray": "#ADA5A8",
  "dkGray": "#746F75",
  "black": "#02040F",
  "teal": "#177E89",
  "green": "#106575",
  "yellow": "#FFC857"
};

var iconsUrlDict = {
  "walkNavy": "icons/walking-navy.svg",
  "bikeNavy": "icons/bicycle-navy.svg",
  "solidNavy": "icons/solid-navy.svg",
  "walkGarnet": "icons/walking-garnet.svg",
  "bikeGarnet": "icons/bicycle-garnet.svg",
  "solidGarnet": "icons/solid-garnet.svg",
  "walkGold": "icons/walking-gold.svg",
  "bikeGold": "icons/bicycle-gold.svg",
  "solidGold": "icons/solid-gold.svg",
  "walkLtGray": "icons/walking-ltGray.svg",
  "bikeLtGray": "icons/bicycle-ltGray.svg",
  "solidLtGray": "icons/solid-ltGray.svg",
  "walkDkGray": "icons/walking-dkGray.svg",
  "bikeDkGray": "icons/bicycle-dkGray.svg",
  "solidDkGray": "icons/solid-dkGray.svg",
  "walkBlack": "icons/walking-black.svg",
  "bikeBlack": "icons/bicycle-black.svg",
  "solidBlack": "icons/solid-black.svg",
  "walkTeal": "icons/walking-teal.svg",
  "bikeTeal": "icons/bicycle-teal.svg",
  "solidTeal": "icons/solid-teal.svg"
};


function init() {
  // create map and set center and zoom level
  map = new L.map('mapid');
  map.setView([38.637959, -90.247017], 12);
  // console.log(map.getZoom());
  
  // -------------------------Basemap and tile layers ---------------------------------
  // create basemap tile layer and add it to map
  var Jawg_Streets = L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=jIiAFQnMbY5Jf6OCw7MBS0LftEKGZRmkNI2KgEHcDpx1mDsndvhIjng2wrBzHmzQ', {
      attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 0,
      maxZoom: 22,
      accessToken: 'jIiAFQnMbY5Jf6OCw7MBS0LftEKGZRmkNI2KgEHcDpx1mDsndvhIjng2wrBzHmzQ'
    });
  Jawg_Streets.addTo(map);

  var Thunderforest_Neighborhood = L.tileLayer('https://{s}.tile.thunderforest.com/neighbourhood/{z}/{x}/{y}.png?apikey={apikey}', {
    attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    apikey: 'abbab3fb0e8b488bbc0eab5844c752c5',
    maxZoom: 22
  });
  
  // create Streets tile layer and add it to map
  // var streetTiles = L.tileLayer('https://geog585-l5-wt2.s3.us-east-2.amazonaws.com/STLBasemap/{z}/{x}/{y}.png');
  // var streetTiles = L.tileLayer('C:/Users/casta/OneDrive365/OneDrive/Documents/GitHub/CAS-13.github.io/GEOG585/tiles/STLBasemap/{z}/{x}/{y}.png');
  var streetTiles = L.tileLayer("../tiles/STLBasemap/{z}/{x}/{y}.png");
  

  // create Wards tile layer and add it to map
  wardLabelTiles = L.tileLayer('https://geog585-l5-wt2.s3.us-east-2.amazonaws.com/WardLabelTiles/{z}/{x}/{y}.png');
  wardLabelTiles.addTo(map);

  // -----------------------------------------------------------------------------------

  var selection;
  var selectedLayer;

  // -------------------------- Thematic layers: Wards ---------------------------------
  
  // Styles for wards layer
  function wardStyle(feature) {
    return {
      fillOpacity: 0,
      color: colorDict["dkGray"]
    };
  }

  function wardSelectedStyle(feature) {
    return {
      fillColor: colorDict["teal"], 
      fillOpacity: 0.1,
      color: colorDict["green"]
    };
  }

  // handle click events on wards
  var i = 1;

  function wardOnEachFeature(feature, layer) {
    // Enhanced this function to allow user to click ward to select or deselect it
    layer.on({
      click: function(e) {

        if (selection) {
          resetStyles();
        }

        if (selection === e.target) {
          // Toggles a feature on and off multiple subsequent times
          i++;
          if (i % 2 === 1) {
            styleFeature();
          }
        }

        else if (selection !== e.target) {
          i = 1; // Resets toggle switch when new feature is selected
          styleFeature();
        }
        
        function styleFeature () {
          e.target.setStyle(wardSelectedStyle());
          selection = e.target;
          selectedLayer = wardsLayer;
          
          // Insert HTML into the sidebar
          var ptsWithinWard = turf.pointsWithinPolygon(incidents, feature.geometry);
          buildSummaryLabel(feature, ptsWithinWard);
        }
        
        L.DomEvent.stopPropagation(e); // stop click event from being propagated further
      }
    });
  }

  // add wards geoJSON layer
  wardsLayer = new L.geoJSON(wards4326, {
    style: wardStyle,
    onEachFeature: wardOnEachFeature
  });

  wardsLayer.addTo(map);
  // -------------------------------------------------------------------------------------------

  // -------------------------- Thematic layers: Incidents and crashes -------------------------
  

  // Default styles for incidents and crashes
  var iconRadius = getRadius();
  // console.log(iconRadius);

  function getRadius() {
    if (map.getZoom() < 13) {
      return 6;
    }
    else if (map.getZoom() < 14) {
      return 8;
    }
    else if (map.getZoom() < 16) {
      return 10;
    }
    // else if (map.getZoom() < 18) {
    //   return 12;
    // }
    else if (map.getZoom() < 22) {
      return 12;
    }
    else {
      return 6;
    }
  }

  // console.log(iconRadius);

  var defaultIcon = L.icon({
    iconUrl: iconsUrlDict["solidBlack"],
    iconSize: [iconRadius, iconRadius]
  });

  var defaultSelectedIcon = L.icon({
    iconUrl: iconsUrlDict["solidTeal"],
    iconSize: [iconRadius*1.5, iconRadius*1.5]
  });

  // // handle styling for incidents and crashes on zoom events
  // // Source: https://stackoverflow.com/questions/18609091/leaflet-js-detecting-when-map-finishes-zooming
  // map.on("zoomend", function (e) { 
  //   console.log(iconRadius);
  //   console.log(map.getZoom()); 
    
  //   defaultIcon.iconSize = [iconRadius, iconRadius];
  //   defaultSelectedIcon.iconSize = [iconRadius*1.5, iconRadius*1.5];
    
  // });

  // handle click events on incidents and crashes
  function incidentsOnEachFeature(feature, layer) {
    layer.on({
      click: function(e) {
        if (selection) {
          resetStyles();
        }

        // console.log(map.getZoom());
        e.target.setIcon(defaultSelectedIcon);
        selection = e.target;
        // console.log(e.target);
        selectedLayer = incidentsLayer;

        buildSummaryLabel(feature);

        L.DomEvent.stopPropagation(e);
      }
    });
  }

  // Add incidents and crashes to map
  incidentsLayer = new L.geoJSON(incidents, {
    pointToLayer: function (feature, latLng) {
      return L.marker(latLng, {icon: defaultIcon});
    },
    onEachFeature: incidentsOnEachFeature
  });

  incidentsLayer.addTo(map);

  
  // -------------------------------------------------------------------------------------------

  // ---------------------------- Map controls: Layers -----------------------------------------
  // Define layer groups
  var baseLayers = {
    "Streets basemap": Jawg_Streets,
    "Neighborhoods basemap": Thunderforest_Neighborhood,
    "Streets - St. Louis only": streetTiles
  };

  var overlays = {
    "Ward labels": wardLabelTiles,
    "Ward boundaries": wardsLayer,
    "Community-report incidents": incidentsLayer//,
    // "Motor vehicle accidents": crashLayer
  };

  L.control.layers(baseLayers, overlays).addTo(map);

  // -------------------------------------------------------------------------------------------

  // -------------- Functions for click behavior and no-selection event handler ----------------
  // Handle clicks on the map that don't hit feature
  map.addEventListener("click", function(e) {
    if (selection) {
      resetStyles();
      selection = null;
    };
  });

  // reset styles to defaults
  function resetStyles () {
    if (selectedLayer === incidentsLayer) selection.setIcon(defaultIcon);
    else if (selectedLayer === wardsLayer) selectedLayer.resetStyle(selection);

    document.getElementById("info").innerHTML = "This page shows community-reported motor vehicle incidents between drivers and bicyclists or pedestrians. Click an incident to get more information."
  }

  // Build HTML for info div using feature attributes
  function buildSummaryLabel (currentFeature, incidentsInWard) {
    if (selectedLayer === wardsLayer) {
      var district = currentFeature.properties.DISTRICT || "Unnamed feature";
      var summaryText;
      var numOfIncidents = incidentsInWard.features.length;
      
      // Create table of pedestrian and bicyclist injuries and fatalities
      var casualties = countCasualties();
      var details = "<table><tr><th>Pedestrian injuries  </th><td>" + casualties["pedInjuries"] + "</td></tr>" + "<tr><th>Pedestrian fatalities  </th><td>" + casualties["pedFatalities"] + "</td></tr>" + "<tr><th>Bicyclist injuries  </th><td>" + casualties["bikeInjuries"] + "</td></tr>" + "<tr><th>Bicylcist fatalities  </th><td>" + casualties["bikeFatalities"] + "</td></tr>" + "</table>";

      // Modify summary text based on if and how many incidents were logged in the ward
      if (numOfIncidents > 0){
        if (numOfIncidents === 1) {
          summaryText = "One motor vehicle incident has been logged in Ward " + district + " since February 2024:&nbsp;" + details;
        }
        else {
          summaryText = "There have been " + numOfIncidents + " motor vehicle incidents logged in Ward " + district + " since February 2024:&nbsp;" + details;
        };
      }
      else {
        summaryText = "There have been no motor vehicle incidents logged in Ward " + district + " since February 2024.";
      };

      document.getElementById("info").innerHTML = "<h2>Ward " + district + " Summary</h2>" + summaryText;

      function countCasualties() {
      // Count the total numbers of pedestrian and bicylcist injuries and fatalities
        var pedInjury = 0;
        var pedKilled = 0;
        var bikeInjury = 0;
        var bikeKilled = 0;
      
        for (let i=0;  i<numOfIncidents; i++) {
          console.log(i);
          if (incidentsInWard.features[i].properties.activity === "Walking") {
            pedInjury = pedInjury + incidentsInWard.features[i].properties.injuries;
            pedKilled = pedKilled + incidentsInWard.features[i].properties.fatalities;
          }
          else if (incidentsInWard.features[i].properties.activity === "Biking") {
            bikeInjury = bikeInjury + incidentsInWard.features[i].properties.injuries;
            bikeKilled = bikeKilled + incidentsInWard.features[i].properties.fatalities;
          }
          summaryText = summaryText + incidentsInWard.features[i].properties.date_and_t + " " + incidentsInWard.features[i].properties.activity;
        };
        return {
          "pedInjuries": pedInjury,
          "pedFatalities": pedKilled,
          "bikeInjuries": bikeInjury,
          "bikeFatalities": bikeKilled
        }; 
      };
    }
    if (selectedLayer === incidentsLayer) {
      var dateObj = new Date(currentFeature.properties.date_and_t);
      var date = getFormattedDate(dateObj);
      var activity = currentFeature.properties.activity;
      var grpSize = currentFeature.properties.group_size;
      var behavior = currentFeature.properties.driver_beh.replaceAll("_", " ").replaceAll(",", ", ").replaceAll("Exited vehicle and approached b", "Exited vehicle");
      document.getElementById("info").innerHTML = "<h3>Community-reported incident</h3><b>" + date + "</b><p><b>Activity: </b>" + activity + "</p><p><b>Group Size: </b>" + grpSize + "</p><p><b>Driver Behavior: </b>" + behavior + "</p>";
    }
  }


} // End init()


// ------------------------------------- Additional functions -----------------------------------
function getFormattedDate(dateObject) {
  var year = dateObject.getFullYear();
  var day = dateObject.getDate();
  var daysOfWeek = [
    "Sunday, ",
    "Monday, ",
    "Tuesday, ",
    "Wednesday, ",
    "Thursday, ",
    "Friday, ",
    "Saturday, "
  ];
  var months = [
    "January ",
    "February ",
    "March ",
    "April ",
    "May ",
    "June ",
    "July ",
    "August ",
    "September ",
    "October ",
    "November ",
    "December "
  ];
  var dow = daysOfWeek[dateObject.getDay()];
  var month = months[dateObject.getMonth()];
  var formattedDate = dow + month + day + ", " + year;
  return formattedDate;
}


