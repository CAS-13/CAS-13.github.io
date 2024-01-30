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
      Known_for: "1) Birthplace of the cereal industry, including Kellogg's and Post\n 2) Stop on the Underground Railroad and home to Sojourner Truth for the last 27 years of her life\n 3) Battle Creek Sanitarium, led by Dr. John Harvey Kellogg"
    };

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

    const popup = {
      title: "{Name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "Name"
            },
            {
              fieldName: "Nickname"
            },
            {
              fieldName: "Population"
            },
            {
              fieldName: "Incorporated"
            },
            {
              fieldName: "Known_for",
              label: "Known for"
            }
          ]
        }
      ]
    }

    const ptGraphic = new Graphic({
      geometry: pt,
      symbol: sym,
      attributes: cityInfo,
      popupTemplate: popup
    });



    view.graphics.add(ptGraphic);
  
  });
