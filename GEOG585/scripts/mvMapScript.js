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
  "solidTeal": "icons/solid-teal.svg",
  "markerNavy": "icons/marker-navy.svg",
  "markerBurg": "icons/marker-burgundy.svg",
  "markerTeal": "icons/marker-teal.svg"
};


function init() {
  // create map and set center and zoom level
  map = new L.map('mapid');
  map.setView([38.637959, -90.247017], 12);
  
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
  var streetTiles = L.tileLayer("https://cas-13.github.io/GEOG585/tiles/STLBasemap/{z}/{x}/{y}.png");
  

  // create Wards tile layer and add it to map
  wardLabelTiles = L.tileLayer('https://cas-13.github.io/GEOG585/tiles/WardLabelTiles/{z}/{x}/{y}.png');
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
        // console.log(e.target);
        if (selection) {
          resetStyles(e.target.feature);
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
          e.target.setStyle(wardSelectedStyle(e.target.feature));
          e.target.bringToFront();
          selection = e.target;
          selectedLayer = wardsLayer;
          
          // Insert HTML into the sidebar
          var incidentsWithinWard = turf.pointsWithinPolygon(incidents, feature.geometry);
          buildSummaryLabel(feature, incidentsWithinWard);
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


  // --------- Choropleth layer ----------------------------------------------------------------

  function getWardColor(riskRating) {
    return riskRating < 700 ? "#fef0d9" :
           riskRating < 1000 ? "#fdcc8a" :
           riskRating < 1200 ? "#fc8d59" :
                               "#d7301f"
  }
  
  function wardRiskStyle(feature) {
    return {
      fillColor: getWardColor(feature.properties.ward_risk_rating),
      fillOpacity: 0.7,
      color: colorDict["dkGray"],

    };
  }

  function wardRiskSelectedStyle(feature) {
    // console.log(feature);
    return {
      fillColor: getWardColor(feature.properties.ward_risk_rating), 
      fillOpacity: 1,
      color: colorDict["ltGray"]
    };
  }

  var j = 1;

  function wardRiskOnEachFeature(feature, layer) {
    // Enhanced this function to allow user to click ward to select or deselect it
    layer.on({
      click: function(e) {
        // console.log(e.target);
        if (selection) {
          resetStyles(e.target.feature);
        }

        

        if (selection === e.target) {
          // Toggles a feature on and off multiple subsequent times
          j++;
          if (j % 2 === 1) {
            styleRiskFeature();
          }
        }

        else if (selection !== e.target) {
          j = 1; // Resets toggle switch when new feature is selected
          styleRiskFeature();
        }
        
        function styleRiskFeature () {
          e.target.setStyle(wardRiskSelectedStyle(e.target.feature));
          e.target.bringToFront();
          selection = e.target;
          selectedLayer = wardsRiskLayer;
          
          // Insert HTML into the sidebar
          var incidentsWithinWard = turf.pointsWithinPolygon(incidents, feature.geometry);
          buildSummaryLabel(feature, incidentsWithinWard);
        }
        
        L.DomEvent.stopPropagation(e); // stop click event from being propagated further
      }
    });
  }

  // add wards geoJSON layer
  wardsRiskLayer = new L.geoJSON(wards4326, {
    style: wardRiskStyle,
    onEachFeature: wardRiskOnEachFeature
  });

  // -------------------------------------------------------------------------------------------

  // -------------------------- Thematic layers: Incidents and crashes -------------------------
  

  // Default styles for incidents and crashes
  var iconRadius = 30;

  var incidentIcon = L.icon({
    iconUrl: iconsUrlDict["markerBurg"],
    iconSize: [iconRadius, iconRadius] 
  });

  var defaultSelectedIcon = L.icon({
    iconUrl: iconsUrlDict["markerTeal"],
    iconSize: [iconRadius*1.25, iconRadius*1.25] 
  });

  var crashIcon = L.icon({
    iconUrl: iconsUrlDict["markerNavy"],
    iconSize: [iconRadius, iconRadius] 
  });

  // handle click events on incidents and crashes
  function incidentsOnEachFeature(feature, layer) {
    layer.on({
      click: function(e) {
        if (selection) {
          resetStyles();
        }

        e.target.setIcon(defaultSelectedIcon);
        selection = e.target;
        selectedLayer = incidentsLayer;

        buildSummaryLabel(feature);
        L.DomEvent.stopPropagation(e);
      }
    });
  }

  
  // Add incidents and crashes to map
  incidentsLayer = new L.geoJSON(incidents, {
    pointToLayer: function (feature, latLng) {
      return L.marker(latLng, {icon: incidentIcon});
    },
    onEachFeature: incidentsOnEachFeature
  });

  // Clustered crash markers
  var crashMarkers = L.markerClusterGroup();
  var markers = {};

  for (var i = 0; i < stlCrashes.features.length; i++) {
    var featureProp = stlCrashes.features[i].properties;
    var crashType;
    if (featureProp.ACC_TYPE === "Pedalcycle") {
      crashType = "Bicyclist";
    } else {
      crashType = "Pedestrian";
    }
    var title = i; // + " (" + crashType + ": " + featureProp.acc_date_str + ")";
    var marker = L.marker(new L.LatLng(featureProp.GPS_LAT, featureProp.GPS_LONG), {title: title, icon: crashIcon});
    markers[i] = marker;
    // var popup = title + ": " + featureProp.OBJECTID;
    // marker.bindPopup(popup);
    crashMarkers.addLayer(marker);
  }

  crashMarkers.on({
    click: function(e) {
      if (selection) {
        resetStyles();
      }

      var objId = e.layer.options.title
      // console.log(objId);
      e.layer.setIcon(defaultSelectedIcon);
      selection = e.layer;
      selectedLayer = crashMarkers;
      // console.log(selection);

      buildSummaryLabel(stlCrashes.features[objId]);
      // var crashFeature = stlCrashes.features;
      // console.log(crashFeature);

      L.DomEvent.stopPropagation(e);
    }
  });


  incidentsLayer.addTo(map);
  map.addLayer(crashMarkers);

  
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
    "Ward risk rating": wardsRiskLayer,
    "Community-report incidents": incidentsLayer,
    "Motor vehicle accidents": crashMarkers
  };

  L.control.layers(baseLayers, overlays, {collapsed: false}).addTo(map);

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
    if (selectedLayer === incidentsLayer) selection.setIcon(incidentIcon);
    else if (selectedLayer === crashMarkers) selection.setIcon(crashIcon);
    else if (selectedLayer === wardsLayer) selectedLayer.resetStyle(selection);
    else if (selectedLayer === wardsRiskLayer) selectedLayer.resetStyle(selection);

    document.getElementById("info").innerHTML = "This page shows community-reported motor vehicle incidents between drivers and bicyclists or pedestrians. Click an incident to get more information."
  }

  // Build HTML for info div using feature attributes
  function buildSummaryLabel (currentFeature, incidentsInWard) {
    var dateObj;
      var date;
      var activity;
      var grpSize;
      var behavior;
      var injuries;
      var fatalities;

    if (selectedLayer === wardsLayer || wardsRiskLayer) {
      var district = currentFeature.properties.DISTRICT || "Unnamed feature";
      var summaryText;
      var numOfIncidents = incidentsInWard.features.length;
      
      // Create table of pedestrian and bicyclist injuries and fatalities
      var casualties = countCasualties();
      // console.log(currentFeature.properties.total_injuries)
      var details = "<table><tr><th></th><th>CRI</th><th>accidents</th></tr><tr><th>Pedestrian injuries  </th><td>" + casualties["pedInjuries"] + "</td><td>" + currentFeature.properties.ped_injuries + "</td></tr>" + "<tr><th>Pedestrian fatalities  </th><td>" + casualties["pedFatalities"] + "</td><td>" + currentFeature.properties.ped_fatalities + "</td></tr>" + "<tr><th>Bicyclist injuries  </th><td>" + casualties["bikeInjuries"] + "</td><td>" + currentFeature.properties.bike_injuries + "</td></tr>" + "<tr><th>Bicylcist fatalities  </th><td>" + casualties["bikeFatalities"] + "</td><td>" + currentFeature.properties.bike_fatalities + "</td></tr></table>";

      // Modify summary text based on if and how many incidents were logged in the ward
      var total_accidents = currentFeature.properties.total_accidents + numOfIncidents;
      var total_injuries = currentFeature.properties.total_injuries + casualties["pedInjuries"] + casualties["bikeInjuries"];
      var total_fatalities = currentFeature.properties.total_fatalities + casualties["pedFatalities"] + casualties["bikeFatalities"];
      var crashSummary = "Since January 2002, there have been " + total_accidents + " total accidents in Ward " + currentFeature.properties.DISTRICT + ", including " + total_injuries + " personal injuries and " + total_fatalities + " fatalities. </p><p>"

      if (numOfIncidents > 0){
        if (numOfIncidents === 1) {
          summaryText = crashSummary + "One community-reported motor vehicle incident (CRI) has been logged in Ward " + district + " since February 2024.&nbsp;" + details;
        }
        else {
          summaryText = crashSummary + "There have been " + numOfIncidents + " community-reported motor vehicle incidents (CRI) logged in Ward " + district + " since February 2024.&nbsp;" + details;
        };
      }
      else {
        summaryText = crashSummary + "There have been no community-reported motor vehicle incidents (CRI) logged in Ward " + district + " since February 2024.&nbsp;" + details;
      };

      document.getElementById("info").innerHTML = "<h2>Ward " + district + " Summary</h2><p>" + summaryText + "</p>";

      function countCasualties() {
      // Count the total numbers of pedestrian and bicylcist injuries and fatalities
        var pedInjury = 0;
        var pedKilled = 0;
        var bikeInjury = 0;
        var bikeKilled = 0;
      
        for (let i=0;  i<numOfIncidents; i++) {
          // console.log(i);
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
      dateObj = new Date(currentFeature.properties.date_and_t);
      date = getFormattedDate(dateObj);
      activity = currentFeature.properties.activity;
      grpSize = currentFeature.properties.group_size;
      behavior = currentFeature.properties.driver_beh.replaceAll("_", " ").replaceAll(",", ", ").replaceAll("Exited vehicle and approached b", "Exited vehicle");
      injuries = currentFeature.properties.injuries;
      fatalities = currentFeature.properties.fatalities;
      document.getElementById("info").innerHTML = "<h3>Community-reported incident</h3><b>" + date + "</b><p><b>Activity: </b>" + activity + "</p><p><b>Group Size: </b>" + grpSize + "</p><p><b>Driver Behavior: </b>" + behavior + "</p><p><b>Injuries: </b>" + injuries + "</p><p><b>Fatalities: </b>" + fatalities + "</p>";
    }
    if (selectedLayer === crashMarkers) {
      // console.log(currentFeature.properties.OBJECTID);
      dateObj = new Date(currentFeature.properties.acc_date_str);
      date = getFormattedDate(dateObj);
      if (currentFeature.properties.ACC_TYPE === "Pedalcycle") {
        activity = "Biking"
      } else {
        activity = "Walking"
      };
      if (currentFeature.properties.driver_behavior === "") {
        behavior = "Unknown"
      } else {
        behavior = currentFeature.properties.driver_behavior;
      }
      injuries = currentFeature.properties.INJURED;
      fatalities = currentFeature.properties.KILLED;

      // console.log(date);
      document.getElementById("info").innerHTML = "<h3>Motor vehicle crash</h3><b>" + date + "</b><p><b>Activity: </b>" + activity + "</p><p><b>Driver Behavior: </b>" + behavior + "</p><p><b>Injuries: </b>" + injuries + "</p><p><b>Fatalities: </b>" + fatalities + "</p>";
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


