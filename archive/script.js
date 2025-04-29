/*global $*/
/*global require*/
/*global console*/
/*global document*/

//ESRI modules used
require(["esri/Graphic","esri/config","esri/WebMap","esri/views/MapView","esri/widgets/Search", "esri/layers/RouteLayer","esri/rest/support/PolygonBarrier","esri/rest/support/FeatureSet","esri/rest/support/PointBarrier","esri/rest/support/RouteParameters","esri/rest/route","esri/layers/FeatureLayer","esri/rest/support/Query","esri/rest/support/Stop","esri/rest/support/RouteInfo","esri/core/Collection","esri/rest/support/TravelMode","esri/rest/networkService","esri/rest/support/DirectionPoint","esri/PopupTemplate","esri/widgets/LayerList","esri/widgets/Legend","esri/widgets/Locate","esri/widgets/Track","esri/widgets/Expand","esri/core/watchUtils","esri/geometry/Point","./config.js"]
, function (Graphic,esriConfig,WebMap,MapView,Search,RouteLayer,PolygonBarrier,FeatureSet,PointBarrier,RouteParameters,route,FeatureLayer,Query,Stop,RouteInfo,Collection,TravelMode,networkService,DirectionPoint,PopupTemplate,LayerList,Legend,Locate,Track,Expand,watchUtils,Point,config) {

	//API key and portal URL 
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurBsWhH_7CMZdbIHG4U1Lc__ohsJyE7rLZgvS4CjZQ2WV5iNfVF2daFQcyi2wO9Ej99IKv3VNTFvNvtgkncF8jhEl4tbOgeOhuVW70cmOi4fGokmeDdG1g32Dn_DKTy19l0x_LFUWWMI4HqgonMsLLQeEAHCI3IwnFPiNLtMrCPUR71_l_oxwEO0e14kPxsTtm5GZIELl6zgZMtg3j-nEG10.AT1_wQWC9Eha";
	esriConfig.portalUrl = "https://lickergeo.maps.arcgis.com";

	//Default basemap 
	var webmap = new WebMap({

        portalItem: {
          id: basemapPortalID
        }
     });

	////Adds the basemap and the routing layers
	var view = new MapView({
        map: webmap,
        container: "viewDiv",
		
    });
	
	view.constraints = {
  geometry: {
    type: "extent",
    xmin: -139.2,   // west edge
    ymin: 48.2,     // south edge
    xmax: -114.0,   // east edge
    ymax: 60.0,     // north edge
    spatialReference: { wkid: 4326 } // WGS84 lat/lon
  },

  minScale: 5000000, // User cannot zoom out beyond a scale of 1:5,000,000
  maxScale: 0, // User can overzoom tiles
  rotationEnabled: false // Disables map rotation
};
	//Routes symbology
	const routesRenderer = {
	type: "unique-value",  // autocasts as new UniqueValueRenderer()
	field: "Route_Ranking",
	uniqueValueInfos: [
	{
	  value: "Business as usual route (best option)",
	  symbol: {
		type: "simple-line",
		color: "#0fb443",  // green
		width: 2,
		style: "solid"
	  },
	  label: "Business as usual route (best option)"
	},
	{
	  value: "Direct Route if critical area closed (second best option)",
	  symbol: {
		type: "simple-line",
		color: "#efd647",  // yellow/orange
		width: 2,
		style: "solid"
	  },
	  label: "Direct Route if critical area closed (second best option)"
	},
	{
	  value: "Reroute if both critical areas are closed (third option)",
	  symbol: {
		type: "simple-line",
		color: "#98282a",  // red
		width: 2,
		style: "solid"
	  },
	  label: "Reroute if both critical areas are closed (third option)"
	}
	]
	  
	};

	//Load in route lines
	var routesFL = new FeatureLayer({
		portalItem:{id: routesPortalID},
		renderer: routesRenderer,
		popupEnabled:false,
		legendEnabled: true,
  		title: "",
		visible: false
	});
	
	view.map.add(routesFL);
	
		//Hubs and facilities symbology
	const facilitiesRenderer = {
	  type: "simple",
	  symbol: {
		type: "cim", // CIMSymbol lets you stack multiple symbol layers
		data: {
		  type: "CIMSymbolReference",
		  symbol: {
			type: "CIMPointSymbol",
			symbolLayers: [
			  {
				type: "CIMVectorMarker",
				enable: true,
				size: 10, // adjust overall size
				frame: {
				  xmin: -8,
				  ymin: -8,
				  xmax: 8,
				  ymax: 8
				},
				markerGraphics: [
				  {
					type: "CIMMarkerGraphic",
					geometry: {
					  rings: [
						[
						  [0, 8],
						  [5.656, 5.656],
						  [8, 0],
						  [5.656, -5.656],
						  [0, -8],
						  [-5.656, -5.656],
						  [-8, 0],
						  [-5.656, 5.656],
						  [0, 8]
						]
					  ]
					},
					symbol: {
					  type: "CIMPolygonSymbol",
					  symbolLayers: [
						{
						  type: "CIMSolidFill",
						  enable: true,
						  color: [77, 134, 146, 255] // Light blue fill (RGB + Alpha)
						}
					  ],
					  geometricEffects: [
						{
						  type: "CIMGeometricEffectBuffer",
						  method: "circle",
						  distance: 6,
						  cornerCount: 100 // <<-- This makes it a smoother circle
						}
					  ]
					}
				  },
				  {
					type: "CIMMarkerGraphic",
					geometry: {
					  paths: [
						[[-4, 0], [4, 0]], // horizontal line of cross
						[[0, -4], [0, 4]]  // vertical line of cross
					  ]
					},
					symbol: {
					  type: "CIMLineSymbol",
					  symbolLayers: [
						{
						  type: "CIMSolidStroke",
						  enable: true,
						  color: [255, 255, 255, 255], // White color
						  width: 2.4,
							capStyle: "butt"
						}
					  ]
					}
				  }
				]
			  }
			]
		  }
		}
	  },
	  label: "Health Facilities"
	};


	//Load in hubs and facilities
	var facilitiesFL = new FeatureLayer({
		portalItem:{id: HubsandFacilitiesPortalID},
		renderer: facilitiesRenderer,
		popupEnabled:false,
		legendEnabled: true,
  		title: "",
		visible: false,
		labelingInfo: [{
			labelExpressionInfo: {
				expression: "$feature.FacilityName"
		},
			symbol: {
			type: "text",  // autocasts as new TextSymbol()
			color: [77, 134, 146],
			haloColor: "white",
			haloSize: "2px",
			font: {
			size: 10,
			family: "Arial"
			}
		},
		labelPlacement: "above-center"
		}],
		labelsVisible: false // we'll toggle this on dynamically
	});
	
	view.map.add(facilitiesFL);
	
	//barriers symbology
	const barriersRenderer = {
		type: "simple",  // autocasts as new SimpleRenderer()
		symbol: {
			type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
			style: "x",
			size: 6,
			color: "black",
			outline: {
      			width: 2,     // Thicker outline for contrast
      			color: "black"
    		}
		},
		label: "Critical Point - Causing Reroute" 
	};
	//Load in barriers
	var barriersFL = new FeatureLayer({
		portalItem:{id: barriersPortalID},
		renderer: barriersRenderer,
		popupEnabled:false,
		legendEnabled: true,
  		title: "",
		visible: false
	});
	
	view.map.add(barriersFL);

	const legend = new Legend({
		view: view,
		container: "legendContainer",
		layerInfos: [
		  {
			layer: barriersFL,
			//title: "My Useful Layer"
		  },
		  {
			layer: facilitiesFL,
		  }
		  // Don't include routesFL here so that it doesnt show up in the legend
		]
	  });
	// Hide legend when no layers are visible
	function updateLegendVisibility() {
	  const hasVisibleLayers = legend.layerInfos.some(info => {
		return info.layer.visible;
	  });

	  const legendDiv = document.getElementById("legendContainer");
	  if (hasVisibleLayers) {
		legendDiv.style.display = "block";
	  } else {
		legendDiv.style.display = "none";
	  }
	}

	legend.layerInfos.forEach(info => {
	  info.layer.watch("visible", updateLegendVisibility);
	});

	// Run once at start
	updateLegendVisibility();
	
	
	
	routesFL.queryFeatureCount().then(count => {
  	console.log("Routes feature count:", count);
});

	// Create the dropdown element
	const odRouteSelect = document.createElement("select");
	odRouteSelect.id = "odRouteSelect";
	document.body.appendChild(odRouteSelect);


	// Function to get unique OD_Route values
	function getUniqueODRoutes() {
	  routesFL.queryFeatures({
		where: "1=1",
		outFields: ["OD_Route"],
		returnDistinctValues: true,
		returnGeometry: false
	  }).then(function(response) {
		const odRoutes = response.features.map(f => f.attributes.OD_Route);
		const uniqueODRoutes = [...new Set(odRoutes)].sort();
		const odRouteSelect = document.getElementById("odRouteSelect");
		uniqueODRoutes.forEach(function(route) {
		  const option = document.createElement("option");
		  option.value = route;
		  option.text = route;
		  odRouteSelect.add(option);
		});
	  });
	}
	let selectedODRoute = null;

  // Populate OD_Route Dropdown
  routesFL.when(() => {
    const query = routesFL.createQuery();
    query.outFields = ["OD_Route"];
    query.returnDistinctValues = true;
    query.where = "1=1";

    routesFL.queryFeatures(query).then((results) => {
      const odValues = [...new Set(results.features.map(f => f.attributes.OD_Route))];
      const odDropdown = document.getElementById("odRouteSelect");

      odValues.sort().forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        odDropdown.appendChild(option);
      });
    });
  });

  // Populate Route_Ranking Dropdown
// Define route ranking styles
const routeRankingStyles = {
  "Business as usual route (best option)": "#0fb443",  // green
  "Direct Route if critical area closed (second best option)": "#efd647",  // yellow
  "Reroute if both critical areas are closed (third option)": "#98282a"   // red
};

// Populate Route_Ranking as custom checkboxes with color swatches
routesFL.when(() => {
  const query = routesFL.createQuery();
  query.outFields = ["Route_Ranking"];
  query.returnDistinctValues = true;
  query.where = "1=1";

  routesFL.queryFeatures(query).then((results) => {
    const rrValues = [...new Set(results.features.map(f => f.attributes.Route_Ranking))];
    const rrContainer = document.getElementById("routeRankingCheckboxes");

    rrValues.forEach(val => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("checkbox-wrapper");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = val;
      checkbox.id = `rr_${val.replace(/\s+/g, "_")}`;
      checkbox.classList.add("route-ranking-checkbox");
      checkbox.addEventListener("change", updateRouteFilter); // call update on change

      const lineSymbol = document.createElement("div");
      lineSymbol.className = "line-symbol";
      lineSymbol.style.backgroundColor = routeRankingStyles[val] || "#999"; // fallback color

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = val;
      label.appendChild(lineSymbol);

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      rrContainer.appendChild(wrapper);
    });
  });
});


  // Handle OD_Route Dropdown Selection
	document.getElementById("odRouteSelect").addEventListener("change", function () {
	  selectedODRoute = this.value;

	  // Clear barriers layer first
	  barriersFL.definitionExpression = "1=0";
	  barriersFL.visible = false;
	  barriersFL.refresh();

	  // Clear facilities layer
	  facilitiesFL.definitionExpression = "1=0";
	  facilitiesFL.refresh();
	  facilitiesFL.labelsVisible = false;

	  routesFL.definitionExpression = "1=0";
	  routesFL.refresh();

	  setTimeout(() => {
		facilitiesFL.definitionExpression = `OD_Route = '${selectedODRoute}'`;
		facilitiesFL.refresh();
		facilitiesFL.visible = true;
		facilitiesFL.labelsVisible = true;
	  }, 100);

	  const query = routesFL.createQuery();
	  query.where = `OD_Route = '${selectedODRoute}'`;
	  routesFL.queryExtent(query).then(function(response) {
		if (response.extent) {
		  view.goTo(response.extent.expand(1.2));
		}
	  });

	  updateRouteFilter();
	});


function updateRouteFilter() {
  const checkboxes = document.querySelectorAll("#routeRankingCheckboxes input[type=checkbox]");
  const selectedOptions = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => `'${cb.value}'`);

  if (selectedODRoute && selectedOptions.length) {
    const routeExpr = `OD_Route = '${selectedODRoute}' AND Route_Ranking IN (${selectedOptions.join(",")})`;
    routesFL.definitionExpression = routeExpr;
    routesFL.visible = true;

    // Now query the filtered route IDs to update the barriers layer
    const query = routesFL.createQuery();
    query.where = routeExpr;
    query.outFields = ["Route_ID", "Route_Ranking"];
    query.returnGeometry = false;

    routesFL.queryFeatures(query).then(function(response) {
      const routeIDs = [...new Set(response.features.map(f => `'${f.attributes.Route_ID}'`))];
      const routeRankings = [...new Set(response.features.map(f => `'${f.attributes.Route_Ranking}'`))];

      if (routeIDs.length && routeRankings.length) {
        barriersFL.definitionExpression = `Route_ID IN (${routeIDs.join(",")}) AND Route_Ranking IN (${routeRankings.join(",")})`;
        barriersFL.visible = true;
        barriersFL.refresh();
      } else {
        barriersFL.definitionExpression = "1=0";
        barriersFL.visible = false;
      }
    });
  } else {
    routesFL.visible = false;
    barriersFL.definitionExpression = "1=0";
    barriersFL.visible = false;
  }
}




	
	
});
