require(["esri/Map", "esri/views/MapView", 
         "esri/geometry/Point", 
         "esri/symbols/SimpleMarkerSymbol",
         "esri/Graphic"], 
         (Map, MapView, Point, SimpleMarkerSymbol, Graphic) => {
    
    let [lat, long] = [42.31763304970155, -85.18441222204387];

    let cityInfo = {
      Name: "Battle Creek, Michigan",
      Nickname: "The Cereal City",
      Population: "52,721 (2020 data)",
      Incorporated: "1859",
      Known_for: "<ul><li>Birthplace of the cereal industry, including Kellogg's and Post \
                  <li>Stop on the Underground Railroad and home to Sojourner Truth for the last 27 years of her life \
                  <li>Battle Creek Sanitarium, led by Dr. John Harvey Kellogg</ul>"
    };

    const pt = new Point({
      latitude: lat,
      longitude: long 
    });

    const map = new Map({
      basemap: "terrain"
    });
  
    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 4,
      center: pt // longitude, latitude
    });

    const sym = new SimpleMarkerSymbol({
      style: "square",
      color: "blue",
      size: 12
    });

    const popup = {
      title: "{Name}",
      content: "<p><strong>Nickname</strong>: {Nickname}</p> \
                <p><strong>Population</strong>: {Population}</p> \
                <p><strong>Incorporated</strong>: {Incorporated}</p> \
                <p><strong>Known for</strong>: {Known_for}</p>"
    };

    const ptGraphic = new Graphic({
      geometry: pt,
      symbol: sym,
      attributes: cityInfo,
      popupTemplate: popup
    });


    view.graphics.add(ptGraphic);
  
  });
