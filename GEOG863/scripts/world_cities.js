require([
    "esri/Map", 
    "esri/views/MapView", 
    "esri/layers/FeatureLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/renderers/ClassBreaksRenderer",
    "esri/widgets/Legend",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/rest/support/Query"
    ], (
    Map, 
    MapView, 
    FeatureLayer, 
    SimpleFillSymbol,
    SimpleMarkerSymbol, 
    SimpleRenderer, 
    ClassBreaksRenderer,
    Legend,
    Graphic,
    GraphicsLayer,
    Query) => {
    
    
    // VARIABLES AND CONSTANTS
    // Map position
    var center = [34, 8.635438];

    // Layers
    var citiesURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0"
    var contURL = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Continents/FeatureServer/0"

    // Fields
    var citiesFields = ["FID", "CITY_NAME", "CNTRY_NAME", "POP", "POP_SOURCE"];

    // Continents
    var continents = ["Africa", "Asia", "Australia", "Oceania", "South America", "Antarctica", "Europe", "North America"]; 

    // Colors (light to dark): cities layer
    var [clr1, clr2, clr3] = ["#eff3ff", "#6baed6", "#084594"];
    
    // Pop-up Template
    var popTemplate = {
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
    var sizeVar = {
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
                size: 10,
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
    var noDataSymbol = new SimpleMarkerSymbol({
        color: clr1,
        outline: {
            color: clr3,
            width: 1
        }
    });

    var dataSymbol = new SimpleMarkerSymbol({
        color: clr2,
        outline: {
            color: clr3,
            width: 1
        }
    });

    var continentSymbol = new SimpleFillSymbol({
        color: "transparent",
        outline: {
            color: "transparent"
        }
    });


    // RENDERERS
    // ClassBreaksRenderer for cities layer
    const citiesRenderer = new ClassBreaksRenderer({
        field: "POP",
        visualVariables: [sizeVar],
        legendOptions: {
                title: "City data available?"
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

    const continentsRenderer = new SimpleRenderer({
        symbol: continentSymbol
    });


    // FEATURE LAYERS
    // Continents
    var continentLayer = new FeatureLayer({
        url: contURL,
        title: "Continent",
        outFields: ["CONTINENT"],
        renderer: continentsRenderer
    });

    // Cities
    var citiesLayer = new FeatureLayer({
        url: citiesURL,
        title: "City Population",
        outFields: citiesFields,
        popupTemplate: popTemplate,
        renderer: citiesRenderer,
        elevationInfo: {
            mode: "on-the-ground"
        },
        definitionExpression: "1=0"
    });

    // Prompt for continent and test against list of valid values
    do {
        var requestedContinent = prompt("Enter a continent: ");
        console.log(typeof requestedContinent);
        console.log(continents.includes(requestedContinent));
    } while (!continents.includes(requestedContinent));


    // MAP AND MAPVIEW
    const map = new Map({
        basemap: "gray-vector",
        ground: "world-elevation"
    });

    // Change map center based on continent queried
    center = getMapPosition(requestedContinent);
    function getMapPosition(focus) {
        switch(focus) {
            case "South America":
                return [-58.779249, -18.927737];
                break;
            case "Africa":
                return [14.806688, 4.675876];
                break;
            case "Asia":
                return[80.523444, 32.278372];
                break;
            case "Australia":
                return[136.337937, -26.382657];
                break;
            case "Oceania":
                return[158.943191, -9.753278];
                break;
            case "Antarctica":
                return[23.486374, -82.735328];
                break;
            case "Europe":
                return[12.459692, 55.362040];
                break;
            case "North America":
                return[-102.548780, 49.213326];
                break;
            default:
                return [34, 8.635438];
                break;
        }
    }

    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: center,
        zoom: 2
    });

    
    // QUERIES
    // User-requested continent
    // Graphics layer to hold result of continents query (i.e., continent geometry feature set)
    const resultsLayer = new GraphicsLayer();

    map.addMany([continentLayer, resultsLayer]); 

    // var requestedContinent = "North America"; // DECLARED AS CONSTANT FOR BUILD/TEST
    var contWhereClause = "CONTINENT = '" + requestedContinent + "'";

    const contQuery = new Query({
        where: contWhereClause,
        returnGeometry: true,
        outFields: ["CONTINENT"]
    });

    continentLayer.when(function() {
        citiesLayer.when(function() {
            return continentLayer.queryFeatures(contQuery);
        }).then(findCities);
    });

    function findCities(selectedContinent) {
        console.log("The cities are: ");
        selectedContinent.features.forEach(function(continent) {
            const cityQuery = new Query({
                geometry: continent.geometry,
                returnGeometry: true,
                spatialRelationship: "intersects",
                outFields: citiesFields
            });

            citiesLayer.queryFeatures(cityQuery).then(function(result) {
                let cities = identifyCities(result, true);
                console.log(cities);
                return cities;
                
            }).then(filterCities);
        });
    }

    citiesList = [];
    var sqlString = "";

    function identifyCities(results) {
        
        const cityFeatures = results.features.map(function(graphic) {
            citiesList.push(graphic.attributes.FID); 
            return graphic;
        });
        sqlString = "('" + citiesList.join("', '") + "')";
        return sqlString; 
        
    }
    
    function filterCities(cities) {
        citiesWhereClause = "FID IN " + cities;
        console.log(citiesWhereClause);
        citiesLayer.definitionExpression = citiesWhereClause;
    }

    // LEGEND
    const legend = new Legend({
        view: view,
        layerInfos: [{
            layer: citiesLayer,
            title: "World City Populations"
        }]
    });

    map.add(continentLayer);
    map.add(citiesLayer);
    view.ui.add(legend, "bottom-left")

    }
);