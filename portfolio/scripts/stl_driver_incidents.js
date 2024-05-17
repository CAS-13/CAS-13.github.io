require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/UniqueValueRenderer",
  "esri/widgets/BasemapToggle",
  "esri/widgets/LayerList",
  "esri/widgets/Expand",
  "esri/core/reactiveUtils",
  "esri/layers/support/FeatureFilter",
  "esri/widgets/TimeSlider",
  "esri/rest/support/Query",
  "esri/widgets/Legend"
], (Map, MapView, FeatureLayer, SimpleMarkerSymbol, UniqueValueRenderer, BasemapToggle, LayerList, Expand, reactiveUtils, FeatureFilter, TimeSlider, Query, Legend) => {


  
  // ----- SECTION 1: CONSTANTS ----- //
  // Map position
  const [lat, long] = [38.634294, -90.244877];
  const defaultZoom = 11;

  // Colors and symbols
  const [navy, purple, garnet, gold, gray, black] = ["#002642", "#42133A", "#840032", "#E59500", "#E5DADA", "#02040F"];
  const symbolSize = "8px";

  // Layer References
  const crashURL = "https://www.mshp.dps.missouri.gov/arcgis/rest/services/STARS_CRASHES/MapServer/0";
  const vgiIncidentsURL = "https://services6.arcgis.com/kt14rQbl0Rmk35cs/arcgis/rest/services/survey123_fbd09dca6a0a492f8180f6529626d17d_results/FeatureServer/0";
  const wardsURL = "https://services6.arcgis.com/kt14rQbl0Rmk35cs/arcgis/rest/services/St_Louis_2020_Ward_Boundaries/FeatureServer";
  const cityBoundaryID = "9e8ecc74bf8943919686d583b5ef08bf";

  // Fields
  const crashFields = ["OBJECTID", "ACC_DATE", "INJURED", "KILLED", "SEVERITY", "CITY", "ACC_TYPE"];
  const vgiFields = ["objectid", "date_and_time_of_incident", "activity", "group_size", "driver_behavior", "details"];
  const wardFields = ["DISTRICT"];

  // Incoming filter
  const crashDefExp = "(CITY='ST LOUIS') AND (ACC_TYPE IN ('Pedalcycle', 'Pedestrian'))";


  // ----- SECTION 2: POP-UPS AND SYMBOLOGY ----- //
  // Pop-up Templates
  const crashPopupTemplate = {
    title: "Accident: {SEVERITY}",
    expressionInfos: [{
      name: "type_of_accident",
      title: "Change pedalcycle to bicyclist",
      expression: "IIF($feature['ACC_TYPE'] == 'Pedalcycle', 'Bicyclist', $feature['ACC_TYPE'])"
    }],
    content: "<strong>Occurred</strong>: {ACC_DATE}<br /><strong>Involved</strong>: {expression/type_of_accident}<br />{INJURED} injured and {KILLED} killed",
    overwriteActions: true
  };

  const vgiPopupTemplate = {
    title: "Incident: {expression/behavior}",
    expressionInfos: [{
      name: "behavior",
      title: "Shorten descriptions of driver behaviors",
      expression: "IIF($feature['driver_behavior'] == 'Exited_vehicle_and_approached_b', 'Exited vehicle', IIF($feature['driver_behavior'] == 'Other_(Please_describe_in_\"Details\"_section)', 'Other', IIF(Find(',', $feature['driver_behavior'])>-1, 'Multiple behaviors', Replace($feature['driver_behavior'], '_', ' '))))"
    },
    {
      name: "type",
      title: "Label bicyclists and pedestrians",
      expression: "IIF($feature['activity'] == 'Biking', 'Bicyclist', 'Pedestrian')"
    }],
    content: "<strong>Occurred</strong>: {date_and_time_of_incident}<br /><strong>Involved</strong>: {expression/type}<br /><strong>Group size</strong>: {group_size}<br /><strong>Incident details</strong>: {details}",
    overwriteActions: true
  };

  // Symbology
  const vgiBikeSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: purple,
    size: symbolSize
  });

  const vgiPedSymbol = new SimpleMarkerSymbol({
    style: "triangle",
    color: purple,
    size: symbolSize
  });

  const bikeInjurySymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: gold,
    size: symbolSize
  });

  const pedInjurySymbol = new SimpleMarkerSymbol({
    style: "triangle",
    color: gold,
    size: symbolSize
  });

  const bikePropSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: navy,
    size: symbolSize
  });

  const pedPropSymbol = new SimpleMarkerSymbol({
    style: "triangle",
    color: navy,
    size: symbolSize
  });

  const bikeFatalSymbol = new SimpleMarkerSymbol({
    style: "circle",
    color: garnet,
    size: symbolSize
  });

  const pedFatalSymbol = new SimpleMarkerSymbol({
    style: "triangle",
    color: garnet,
    size: symbolSize
  });

  const vgiRenderer = new UniqueValueRenderer({
    field: "activity",
    uniqueValueGroups: [{
      heading: "Involved in Incident",
      classes: [{
        label: "Bicyclist",
        symbol: vgiBikeSymbol,
        values: "Biking"
      }, 
      {
        label: "Pedestrian",
        symbol: vgiPedSymbol,
        values: ["Walking", "Running"]
      }]
    }]
  });

  const crashRenderer = new UniqueValueRenderer({
    field: "ACC_TYPE",
    field2: "SEVERITY",
    fieldDelimiter: ", ",
    uniqueValueGroups: [{
      heading: "Bicyclist accident severity",
      classes: [{
        values: {
          value: "Pedalcycle", 
          value2: "Property Damage"
        },
        symbol: bikePropSymbol,
        label: "Property damage"
      },
      {
        values: {
          value: "Pedalcycle", 
          value2: "Personal Injury"
        },
        symbol: bikeInjurySymbol,
        label: "Personal injury"
      },
      {
        values: {
          value: "Pedalcycle", 
          value2: "Fatal"
        },
        symbol: bikeFatalSymbol,
        label: "Fatal"
      }]},
      {
        heading: "Pedestrian accident severity",
        classes: [{
          values: {
            value: "Pedestrian", 
            value2: "Property Damage"
          },
          symbol: pedPropSymbol,
          label: "Property damage"
        },
        {
          values: {
            value: "Pedestrian", 
            value2: "Personal Injury"
          },
          symbol: pedInjurySymbol,
          label: "Personal injury"
        },
        {
          values: {
            value: "Pedestrian", 
            value2: "Fatal"
          },
          symbol: pedFatalSymbol,
          label: "Fatal"
        }]
      }]
    });


  // ----- SECTION 3: LAYERS ----- //
  const cityLayer = new FeatureLayer({
    portalItem: {
      id: cityBoundaryID
    },
    legendEnabled: false
  });

  const wardsLayer = new FeatureLayer({
    url: wardsURL,
    title: "Ward",
    outFields: wardFields
  });

  const crashLayer = new FeatureLayer({
    url: crashURL,
    title: "Motor Vehicle Accidents",
    outFields: crashFields,
    popupTemplate: crashPopupTemplate,
    definitionExpression: crashDefExp,
    timeInfo: {
      startField: "ACC_DATE", // name of the date field
      interval: {
        // set time interval to one day
        unit: "days",
        value: 1
      }
    },
    renderer: crashRenderer
  });

  const vgiLayer = new FeatureLayer({
    url: vgiIncidentsURL,
    title: "Community-Reported Incidents",
    outFields: vgiFields,
    popupTemplate: vgiPopupTemplate,
    timeInfo: {
      startField: "date_and_time_of_incident", // name of the date field
      interval: {
        // set time interval to one day
        unit: "days",
        value: 1
      }
    },
    renderer: vgiRenderer
  });


  // ----- SECTION 4: MAP AND MAPVIEW ----- //
  const map = new Map({
    basemap: "streets-vector",
    layers: [wardsLayer, crashLayer, vgiLayer]
  });

  const mapview = new MapView({
    container: "viewDiv",
    map: map,
    zoom: defaultZoom,
    center: [long, lat]
  });
  

  // ----- SECTION 5: WIDGETS ----- //
  // Basemap toggle
  let basemapToggle = new BasemapToggle({
    view: mapview,
    nextBasemap: "gray-vector"
  });

  const basemapExpand = new Expand({
    expandIcon: "basemap",  
    expandTooltip: "Switch Basemap", 
    view: mapview,
    content: basemapToggle
  });

  // Layer List
  let layerList = new LayerList({
    view: mapview,
    label: "Toggle Layers"
  });

  const layerListExpand = new Expand({
    expandIcon: "layers",  
    expandTooltip: "Expand LayerList", 
    view: mapview,
    content: layerList
  });

  // Legend
  let legend = new Legend({
    view: mapview,
    layerInfos: [{
      layer: crashLayer,
      title: "Motor vehicle accidents"
    }, 
    {
      layer: vgiLayer,
      title: "Community-reported incidents"
    }],
    style: "classic"
  });

  const legendExpand = new Expand({
    expandIcon: "legend",
    expandTooltip: "Expand Legend",
    view: mapview,
    content: legend,
    expanded: false
  });

  // Time slider
  

  mapview.ui.add(legendExpand, "top-left");
  mapview.ui.add(basemapExpand, "top-left");
  mapview.ui.add(layerListExpand, "top-left");


  // ----- SECTION 6: FILTER RESULTS (SIDEBAR) ----- //
  // Populate wards dropdown
  populateWards();

  // Create filter layer views
  let crashLayerView;
  let incLayerView;

  // Attribute filter elements
  const bikeFilterElement = document.getElementById("toggle-bike-activity");
  const pedFilterElement = document.getElementById("toggle-ped-activity");
  const severityElement = document.getElementById("severitySelect");
  const wardElement = document.getElementById("wardSelect");


  // Attribute filter listeners
  bikeFilterElement.addEventListener("click", filterAll);
  pedFilterElement.addEventListener("click", filterAll);
  severityElement.addEventListener("change", filterAll);
  wardElement.addEventListener("change", filterAll);
  

  // View filter results
  mapview.whenLayerView(vgiLayer).then((layerView) => {
    incLayerView = layerView; 
  });

  mapview.whenLayerView(crashLayer).then((layerView) => {
    crashLayerView = layerView; 
  });


  // ----- SECTION 7: FUNCTIONS ----- //
  function filterAll() {
    const attributesFilter = filterAttributes();
    const crashWhere = attributesFilter[0];
    const incWhere = attributesFilter[1];
    
    const wardDefExp = filterWard();

    if (wardDefExp == null) {
      wardsLayer.definitionExpression = wardDefExp;
			crashLayerView.filter = new FeatureFilter({
        where: crashWhere
      });
      incLayerView.filter = new FeatureFilter({
        where: incWhere
      });
    } else {
      wardsLayer.definitionExpression = wardDefExp;
      wardsLayer.queryFeatures().then(function(results) {
        const wardGeometry =  results.features[0].geometry;
      

      crashLayerView.filter = new FeatureFilter({
        where: crashWhere,
        geometry: wardGeometry,
        spatialRelationship: "intersects"
      });
      incLayerView.filter = new FeatureFilter({
        where: incWhere,
        geometry: wardGeometry,
        spatialRelationship: "intersects"
      });
      }); // End wards layer query
    }
  };
  
  function filterAttributes() {
    const bikeToggle = document.getElementById("toggle-bike-activity");
    const pedToggle = document.getElementById("toggle-ped-activity");
    const severityElement = document.getElementById("severitySelect");
    
  
    const biking = bikeToggle.value;
    const walking = pedToggle.value;
    const severity = severityElement.value;
    
  
    console.log("biking: " + biking);
    console.log("walking: " + walking);
    console.log("Severity: " + severity);

    let crashWhere;
    let incWhere;
    
    if (severity == "All") {
      if ((biking == "false") & (walking == "false")) {
        crashWhere = "1=0";
        incWhere = "1=0";
      } else if ((biking == "true") & (walking == "false")) {
        crashWhere = "ACC_TYPE = 'Pedalcycle'";
        incWhere = "activity = 'Biking'";
      } else if ((biking == "false") & (walking == "true")) {
        crashWhere = "ACC_TYPE = 'Pedestrian'";
        incWhere = "activity IN ('Walking', 'Running')";
      } else {
        crashWhere = "1=1";
        incWhere = "1=1";
      };
    } else {
      if ((biking == "false") & (walking == "false")) {
        crashWhere = "1=0";
        incWhere = "1=0";
      } else if ((biking == "true") & (walking == "false")) {
        crashWhere = "ACC_TYPE = 'Pedalcycle' AND SEVERITY = '" + severity + "'";
        incWhere = "activity = 'Biking'";
      } else if ((biking == "false") & (walking == "true")) {
        crashWhere = "ACC_TYPE = 'Pedestrian' AND SEVERITY = '" + severity + "'";
        incWhere = "activity IN ('Walking', 'Running')";
      } else {
        crashWhere = "SEVERITY = '" + severity + "'";
        incWhere = "1=1";
      };
    }
  
    console.log(crashWhere + "; " + incWhere);
  
    return [crashWhere, incWhere];
  };  // End filterActivity function


  function filterWard() {
    const wardElement = document.getElementById("wardSelect");
    const ward = wardElement.value;
    console.log("ward: " + ward);
    let wardDefExp;

    if (ward == "All") {
      wardDefExp = null;
    } else {
      wardDefExp = "DISTRICT = '" + ward + "'";
      console.log("Wards def exp = " + wardDefExp);
    }
    return wardDefExp;
  }

}); // End require