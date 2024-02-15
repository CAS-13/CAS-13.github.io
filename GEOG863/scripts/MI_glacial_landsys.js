// var view;

require(["esri/Map", 
         "esri/views/SceneView", 
         "esri/layers/FeatureLayer",
         "esri/symbols/PolygonSymbol3D",
         "esri/symbols/FillSymbol3DLayer",
         "esri/renderers/UniqueValueRenderer",
         "esri/widgets/Legend"
        ], (
  Map,
  SceneView,
  FeatureLayer,
  PolygonSymbol3D,
  FillSymbol3DLayer,
  UniqueValueRenderer,
  Legend
) => {

  // CONSTANTS
  // List of glacial landsystems and fill colors. Sourced color palette from coolers.co
  landsystems = ["Bedrock", "Coastal Dunes", "Ice-contact outwash", "Lacustrine Fine", "Lacustrine coarse", "Lakes", "Lodge Till or Fine supraglacial drift", "Proglacial outwash", "Thin drift over bedrock", "ice-marginal till"];
  alpha = 0.6;
  colors = [
    [242, 193, 78, alpha],
    [245, 161, 81, alpha], 
    [215, 82, 82, alpha], 
    [126, 92, 220, alpha], 
    [90, 136, 193, alpha], 
    [134, 211, 216, alpha], 
    [195, 197, 199, alpha], 
    [162, 137, 102, alpha], 
    [169, 183, 82, alpha],
    [95, 173, 86, alpha]
  ]; 


  // MAP AND SCENEVIEW
  // Create map variable
  const map = new Map({
    basemap: "topo-vector",
    ground: "world-elevation"
  });

  // Create scene
  view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: [-86, 37, 1150000],
      tilt: 35,
      heading: 0.3
    }
  });


  // RENDERER
  // Unique values renderer
  const landsysRenderer = new UniqueValueRenderer({
    field: "LDSYSTEM"
  });

  // Function to define unique values and their symbology
  const addClass = function(item, clr, renderer) {
    
    // Format label
    var lbl = item.toLowerCase();
    lbl = lbl.replace(lbl[0], lbl[0].toUpperCase())

    // Create polygon fill symbol
    var sym = new PolygonSymbol3D({
          symbolLayers: [
            new FillSymbol3DLayer({
              material: {color: clr},
              outline: {
                color: "black",
                size: 1
              }
            })
          ]
        });
    
      // Add unique values, symbols, and labels to renderer
      renderer.addUniqueValueInfo({
        value: item,
        symbol: sym,
        label: lbl
      });
   };

  // for loop to create value-symbol pairs for unique values in list of glacial landsystems
  for (let i = 0, len = landsystems.length; i < len; i++) {
    addClass(landsystems[i], colors[i], landsysRenderer);    
  };


  // POPUP
  // Create pop-up template
  const template = {
    title: "{LDSYSTEM}",
    expressionInfos: [{
      name: "percentage",
      title: "% of total area that is each glacial landsystem",
      expression: "Round($feature['Shape.STArea()']/1503070000, 1)"
    }, {
      name: "landsysLbl",
      title: "formatted landsystem label",
      expression: "Proper($feature['LDSYSTEM'], 'firstword')"
    }],
    content: "<b>{expression/landsysLbl}</b> makes up approximately {expression/percentage}% of Michigan's total land area."
  };
 

  // LAYER
  // Create feature layer (https://gis-michigan.opendata.arcgis.com/datasets/egle::glacial-landsystems/explore)
  const featureLayer = new FeatureLayer({
    url: "https://gisagocss.state.mi.us/arcgis/rest/services/OpenData/hydro/MapServer/9/",
    popupTemplate: template,
    renderer: landsysRenderer
  });


  // LEGEND
  const legend = new Legend({
    view: view,
    layerInfos: [{
      layer: featureLayer,
      title: "Glacial Landsystems"
    }]
  });


  // ADD ELEMENTS TO MAP/SCENEVIEW
  // Add feature layer
  map.add(featureLayer);
  view.ui.add(legend, "bottom-left")
  
});