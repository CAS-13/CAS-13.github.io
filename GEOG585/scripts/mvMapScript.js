var map;
var layerDict = {};
var wardLabelTiles;
var StreetTiles;
var crashLayer;
var incidentsLayer;


function init() {
  // create map and set center and zoom level
  map = new L.map('mapid');
  map.setView([38.637959, -90.247017], 12);
  console.log(map.getZoom());
  
  // create basemap tile layer and add it to map
  var Jawg_Streets = L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=jIiAFQnMbY5Jf6OCw7MBS0LftEKGZRmkNI2KgEHcDpx1mDsndvhIjng2wrBzHmzQ', {
      attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 0,
      maxZoom: 22,
      accessToken: 'jIiAFQnMbY5Jf6OCw7MBS0LftEKGZRmkNI2KgEHcDpx1mDsndvhIjng2wrBzHmzQ'
    });
  Jawg_Streets.addTo(map);
  
  // create Streets tile layer and add it to map
  StreetTiles = L.tileLayer('https://geog585-l5-wt2.s3.us-east-2.amazonaws.com/STLRoadsTiles/{z}/{x}/{y}.png');
  layerDict["Streets"] = StreetTiles;
  StreetTiles.addTo(map);

  // create Wards tile layer and add it to map
  wardLabelTiles = L.tileLayer('https://geog585-l5-wt2.s3.us-east-2.amazonaws.com/WardTiles/{z}/{x}/{y}.png');
  layerDict["Wards"] = wardLabelTiles;
  wardLabelTiles.addTo(map);

  // create incidents Layer and crashLayer symbology at different zoom levels
  var colorDict = {
    "navy": "#002642",
    "garnet": "#840032",
    "gold": "#E59500",
    "ltGray": "#ADA5A8",
    "dkGray": "#746F75",
    "black": "#02040F",
    "teal": "#177E89"
  };

  // var baseURL = "C:/Users/casta/OneDrive365/OneDrive/Documents/GitHub/CAS-13.github.io/GEOG585";

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
  }

  var selection;
	var selectedLayer;

  // // Initialize variables and set default icon style
  // var iconSize = [5, 5];
  // var defaultIconColor = "Black";
  // var iconStyle = "solid";
  // var defaultIconUrl = baseURL + "/" + iconsUrlDict[iconStyle + defaultIconColor];
  // console.log(defaultIconUrl);

  // var defaultIcon = L.icon({
  //   iconUrl: defaultIconUrl,
  //   iconSize: iconSize
  // });

  // var selectedIconUrl = baseURL + "/" + iconsUrlDict[iconStyle + "Teal"];
  // console.log(selectedIconUrl);

  // var selectedIcon = L.icon({
  //   iconUrl: selectedIconUrl,
  //   iconSize: iconSize
  // });

  function incidentsOnEachFeature(feature, layer){
    layer.on({
      click: function(e) {
        if (selection) {
          resetStyles();
        }
                    
        e.target.setIcon(selectedIcon);
        selection = e.target;
        selectedLayer = incidentsLayer;
                    
        // Insert some HTML with the feature name
        buildSummaryLabel(feature);

        L.DomEvent.stopPropagation(e); // stop click event from being propagated further
      }
    });
  };

  incidentsLayer = new L.geoJSON(incidents, {
    pointToLayer: function (feature, latLng) {
      return L.marker(latLng, {icon: defaultIcon});
    },
    onEachFeature: incidentsOnEachFeature,
    pane: "markerPane"
  });
  console.log("add layer");

  incidentsLayer.addTo(map);

  // var crashMarker = L.circleMarker({
  //   // default styling
  //   radius: 4,
  //   color: colorDict["black"],
  //   weight: 1,
  //   fill: true
  // });

  // function crashStyleSmScale(feature) {
  //   var ptColor;
  //   // Insert "if/switch" statement to select color based on ACC_TYPE //
  //   ptColor = colorDict["navy"]; // Placeholder to be replaced by if/switch

  //   return {
  //     radius: 4,
  //     color: ptColor
  //   }
  // }

  // crashLayer = new L.geoJSON(stlCrashes, {
  //    pointToLayer: function (feature, latLng) {
  //     return L.marker(latLng, {icon: crashMarker});
  //    }
  // });

  // crashLayer.addTo(map);
  
}

// Show/hide layers
function layerDisplay(buttonID) {
  var button = document.getElementById(buttonID);
  var val = button.value;
  var layerName = layerDict[buttonID];

  if (val == ("Hide " + buttonID)) {
    console.log("remove tiles");
    layerName.removeFrom(map);
    button.value = "Show " + buttonID;
  }

  if (val == ("Show " + buttonID)) {
    console.log("add tiles");
    layerName.addTo(map);
    button.value = "Hide " + buttonID;
  }
  
}