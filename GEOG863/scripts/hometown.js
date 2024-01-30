require(["esri/Map", "esri/views/MapView", 
         "esri/geometry/Point", 
         "esri/symbols/SimpleMarkerSymbol",
         "esri/Graphic"], 
         (Map, MapView, Point, SimpleMarkerSymbol, Graphic) => {
    
    let [lat, long] = [42.31763304970155, -85.18441222204387];

    const map = new Map({
      basemap: "terrain"
    });
  
    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 4,
      center: [long, lat] // longitude, latitude
    });
  
    const pt = new Point({
      latitude: lat,
      longitude: long 
    });

    const sym = new SimpleMarkerSymbol({
      style: "square",
      color: "blue",
      size: 12
    });

    const ptGraphic = new Graphic({
      geometry: pt,
      symbol: sym
    });

    view.graphics.add(ptGraphic);
  
  });
