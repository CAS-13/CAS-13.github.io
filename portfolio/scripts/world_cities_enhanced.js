require([
    "esri/Map", 
    "esri/views/MapView", 
    "esri/layers/FeatureLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/renderers/ClassBreaksRenderer",
    "esri/widgets/Legend",
    "esri/rest/support/Query"
    ], (
    Map, 
    MapView, 
    FeatureLayer, 
    SimpleMarkerSymbol, 
    ClassBreaksRenderer,
    Legend,
    Query) => {
    
    
    // VARIABLES AND CONSTANTS
    // Layers
    const citiesURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0"
    const contURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Continents/FeatureServer/0"

    // Fields
    const citiesFields = ["FID", "CITY_NAME", "CNTRY_NAME", "POP", "POP_SOURCE"];

    // Colors (light to dark): cities layer
    const [clr1, clr2, clr3] = ["#eff3ff", "#6baed6", "#084594"];
    
    // Pop-up Template
    const popTemplate = {
        title: "{CITY_NAME}, {CNTRY_NAME}",
        expressionInfos: [{
            name: "population",
            title: "City population (treats zeroes as unknowns)",
            expression: "IIF($feature['POP'] == 0, 'Unknown', Text($feature['POP'], '##,###,###'))"
        }, {
            name: "source",
            title: "Source for population data",
            expression: "IIF($feature['POP'] == 0, 'N/A', $feature['POP_SOURCE'])"
        }],
        content: "<strong>Total population</strong>: {expression/population}<br /><em>Source: {expression/source}</em>",
        overwriteActions: true
    };
    

    // VISUAL VARIABLES
    // Size variable: population
    const sizeVar = {
        type: "size",
        field: "POP",
        valueUnit: "unknown",
        stops: [
            {
                value: 5000,
                size: 4,
                label: "< 5K"
            },
            {
                value: 250000,
                size: 8,
                label: "5K - 250K"
            },
            {
                value: 1000000,
                size: 12,
                label: "250K - 1M"
            },
            {
                value: 7500000,
                size: 20,
                label: "1M - 7.5M"
            },
            {
                value: 15000000,
                size: 40,
                label: "> 15M"
            }
        ],
        legendOptions: {
            title: "Number of people"
        }
    };

    // Symbols and labels: Cities
    const noDataSymbol = new SimpleMarkerSymbol({
        color: clr1,
        outline: {
            color: clr3,
            width: 1
        }
    });

    const dataSymbol = new SimpleMarkerSymbol({
        color: clr2,
        outline: {
            color: clr3,
            width: 1
        }
    });

    
    // RENDERERS
    // ClassBreaksRenderer for cities layer to distinguish cities for which 
    // population data does and does not exist in the dataset.
    // If POP=0, data does not exist.
    const citiesRenderer = new ClassBreaksRenderer({
        field: "POP",
        visualVariables: [sizeVar],
        legendOptions: {
                title: "City population data available?"
        }
    });

    citiesRenderer.addClassBreakInfo({
        minValue: 0,
        maxValue: 1,
        symbol: noDataSymbol,
        label: "No"
    });

    citiesRenderer.addClassBreakInfo({
        minValue: 2,
        maxValue: 1000000000,
        symbol: dataSymbol,
        label: "Yes"
    });    


    // FEATURE LAYERS
    // Continents
    const continentLayer = new FeatureLayer({
        url: contURL,
        title: "Continent",
        outFields: ["CONTINENT"]
    });

    // Cities
    const citiesLayer = new FeatureLayer({
        url: citiesURL,
        title: "City Population",
        outFields: citiesFields,
        popupTemplate: popTemplate,
        renderer: citiesRenderer,
        elevationInfo: {
            mode: "on-the-ground"
        },
        definitionExpression: "1=0" // Hide all features client-side by default
    });

    const map = new Map({
        basemap: "gray-vector",
        ground: "world-elevation"
    });

    let allContinents = [];
    let centroids = [];
    let centroidDict = {};
    let continentSelect = document.getElementById("continentSelect");
    const listNode = document.getElementById("list_cities");
    

    // QUERY FEATURES
    continentLayer.queryFeatures().then(function(results) {
          results.features.forEach(function(item) {
            if (item.attributes.CONTINENT != "Antarctica") {
                allContinents.push(item.attributes.CONTINENT); // List of all continents
                centroids.push(item.geometry.centroid); // List of centroids of all continents
            }
        });

        createDict(allContinents, centroids); // Enables matching of centroid to continent 
        // after continent layer is sorted alphabetically for the dropdown box in addToSelect function

        function createDict(keys, values) {
            keys.forEach((key, i) => centroidDict[key] = values[i]);
            console.log(centroidDict);
        }

        addToSelect(allContinents);

        function addToSelect(continentList) {
            continentList.sort();
            continentList.forEach(function(continent) {
                let option = document.createElement("option");
                option.text = continent;
                continentSelect.add(option);
            });

        }

        document.getElementById("continentSelect").addEventListener("change", getContinent);

        function getContinent() {
            
            let event = document.getElementById("continentSelect");
            console.log("Event: " + event.value);
            if (event.value == "") {
                () => {} // Error handling for if/when user chooses "Select..." from the dropdown
            } else {

                let requestedContinent = event.value;
                
                // MAPVIEW
                const view = new MapView({
                    container: "viewDiv",
                    map: map,
                    center: centroidDict[requestedContinent],
                    zoom: 2
                });

                continentLayer.definitionExpression = "CONTINENT = '" + requestedContinent + "'";
                console.log("CONTINENT = '" + requestedContinent + "'");

                // Spatial query of cities layer based on intersection with requested continent
                continentLayer.queryFeatures().then(function(contResults) {
                    const cityQuery = new Query({
                        geometry: contResults.features[0].geometry,
                        returnGeometry: true,
                        spatialRelationship: "intersects",
                        outFields: citiesFields,
                        orderByFields: ["CNTRY_NAME", "CITY_NAME"]
                    });

                    const graphics = [];

                    citiesLayer.queryFeatures(cityQuery).then(function(cityResults) {
                        const cities = cityResults.features.map(
                            (feature) => feature.attributes.FID
                        );
                        citiesLayer.definitionExpression = `FID IN (${cities.join(",")})`;

                        // Begin side panel code here
                        const fragment = document.createDocumentFragment();

                        cityResults.features.forEach(function(city, index) {
                            city.popTemplate = popTemplate;

                            graphics.push(city);

                            const attributes = city.attributes;
                            const name = attributes.CITY_NAME + " (" + attributes.CNTRY_NAME + ")";
                            
                            const li = document.createElement("li");
                            li.classList.add("panel-result");
                            li.tabIndex = 0;
                            li.setAttribute("data-result-id", index);
                            li.textContent = name;

                            fragment.appendChild(li);
                        }); 

                        listNode.innerHTML = "";
                        listNode.appendChild(fragment);

                    });

                    listNode.addEventListener("click", onListClickHandler);

                    function onListClickHandler(event) {
                        const target = event.target;
                        console.log(event.target);
                        console.log("Data-result-id: " + event.target.getAttribute("data-result-id"));

                        const resultId = target.getAttribute("data-result-id");

                        const result = resultId && graphics && graphics[parseInt(resultId, 10)];

                        if (result) {
                            const point = [result.geometry.longitude, result.geometry.latitude];
                            view.center = point;
                            view.zoom = 4;
                            view.openPopup({
                                features: [result],
                                location: point
                            });
                            
                        }
                    }


                    // LEGEND
                    let legend = new Legend({
                        view: view,
                        layerInfos: [{
                            layer: citiesLayer,
                            title: "World City Populations"
                        }],
                        style: "card"
                    });

                    map.add(citiesLayer);
                    view.ui.add(document.getElementById("selectBox"));
                    view.ui.add(legend, "bottom-left");
                    
                    
                    // // Confirm citiesLayer and basemap have the same spatial reference
                    // view.when(function() {
                    //     console.log('Basemap SR: ' + view.map.basemap.baseLayers.items[0].spatialReference.wkid);
                    //     console.log('Cities SR: ' + citiesLayer.spatialReference.wkid);
                    // })
                    
                });
            }

        };

    });
});