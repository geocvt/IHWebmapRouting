/*global $*/
/*global require*/
/*global console*/
/*global document*/

//ESRI modules used
require(["esri/Graphic","esri/config","esri/WebMap","esri/views/MapView","esri/widgets/Search", "esri/layers/RouteLayer","esri/rest/support/PolygonBarrier","esri/rest/support/FeatureSet","esri/rest/support/PointBarrier","esri/rest/support/RouteParameters","esri/rest/route","esri/layers/FeatureLayer","esri/rest/support/Query","esri/rest/support/Stop","esri/rest/support/RouteInfo","esri/core/Collection","esri/rest/support/TravelMode","esri/rest/networkService","esri/rest/support/DirectionPoint","esri/PopupTemplate","esri/widgets/LayerList","esri/widgets/Legend","esri/widgets/Locate","esri/widgets/Track","esri/widgets/Expand","esri/core/watchUtils","esri/geometry/Point","./config.js", "esri/layers/TileLayer", "esri/layers/VectorTileLayer", "esri/smartMapping/renderers/color"]
, function (Graphic,esriConfig,WebMap,MapView,Search,RouteLayer,PolygonBarrier,FeatureSet,PointBarrier,RouteParameters,route,FeatureLayer,Query,Stop,RouteInfo,Collection,TravelMode,networkService,DirectionPoint,PopupTemplate,LayerList,Legend,Locate,Track,Expand,watchUtils,Point,config,TileLayer,VectorTileLayer, colorRendererCreator) {

	//API key and portal URL 
    esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurBsWhH_7CMZdbIHG4U1Lc__ohsJyE7rLZgvS4CjZQ2WV5iNfVF2daFQcyi2wO9Ej99IKv3VNTFvNvtgkncF8jhEl4tbOgeOhuVW70cmOi4fGokmeDdG1g32Dn_DKTy19l0x_LFUWWMI4HqgonMsLLQeEAHCI3IwnFPiNLtMrCPUR71_l_oxwEO0e14kPxsTtm5GZIELl6zgZMtg3j-nEG10.AT1_wQWC9Eha";
	esriConfig.portalUrl = "https://lickergeo.maps.arcgis.com";

	//basemap 
	var webmap = new WebMap({

        portalItem: {
          id: basemapPortalID
        }
     });

	////Adds the basemap
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

  minScale: 5000000, //dont zoom out beyond a scale of 1:5,000,000
  maxScale: 0, //  can overzoom tiles
  rotationEnabled: false // Disables map rotation
};


	//Routes symbology
	const routesRenderer = {
	type: "unique-value",  //  UniqueValueRenderer() for symbology
	field: "Route_Ranking",
	uniqueValueInfos: [
	{
	  value: "Business as usual route (best option)",
	  symbol: {
		type: "simple-line",
		color: "#0fb443",  // green!
		width: 2,
		style: "solid"
	  }
	},
	{
	  value: "Direct Route if critical area closed (second best option)",
	  symbol: {
		type: "simple-line",
		color: "#efd647",  // yellow/orange
		width: 2,
		style: "solid"
	  }
	},
	{
	  value: "Reroute if both critical areas are closed (third option)",
	  symbol: {
		type: "simple-line",
		color: "#98282a",  // red
		width: 2,
		style: "solid"
	  }
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
	
	const routeRankingDisplayNames = {
  "Business as usual route (best option)": "Primary (Best Route)",
  "Direct Route if critical area closed (second best option)": "Secondary (next direct route after a worst case road closure)",
  "Reroute if both critical areas are closed (third option)": "Tertiary (next direct route after a worst case road closure for primary and secondary routes)"
};

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
			type: "picture-marker",  // Use a picture marker to mimic the road caution symbol
			url: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Slovenia_road_sign_II-4.svg",
			width: "12px",
			height: "12px"
		},
		label: "Critical Point - Causing Longest Reroute" 
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

    //setup flood symbology
	const floodRenderer = {
	  type: "unique-value",
	  field: "Id",
	  legendOptions: {
		title: "Flood Depth (Metres)"
	  },
	  uniqueValueInfos: [
		{
		  value: 1,
		  symbol: {
			type: "simple-fill",
			color: [3, 242, 225, 0.8],  // turquoise, RGBA with 75% opacity
			outline: {
			  width: 0
			}
		  }
		},
		{
		  value: 2,
		  symbol: {
			type: "simple-fill",
			color: [128, 132, 232, 0.8],  // purple, RGBA with opacity
			outline: {
			  width: 0
			}
		  }
		},
		{
		  value: 3,
		  symbol: {
			type: "simple-fill",
			color: [245, 103, 223, 0.8],  // pink, RGBA with opacity
			outline: {
			  width: 0
			}
		  }
		}
	  ]
	};
	
	// hazard layers (toggle(floodFL), seperate dropdown box for various selections on closuresFL)
	//Load in flooding layer
	var floodFL = new FeatureLayer({
		portalItem:{id:floodingPortalID },
		popupEnabled:false,
		renderer: floodRenderer,
		legendEnabled: true,
  		title: "Modelled Flood Hazard",
		visible: false
	});
	
	view.map.add(floodFL);
	
	
	var closuresFL = new FeatureLayer({
		portalItem:{id:closuresPortalID },
		popupEnabled:false,
		legendEnabled: true,
  		title: "",
		visible: false
	});
	
	view.map.add(closuresFL);
	
	//Load in landslide data
	var landslideFL = new FeatureLayer({
		portalItem:{id: landslidePortalID},
		popupEnabled:false,
		legendEnabled: true,
  		title: "Historic Land Slides - Density of Landslide Occurrences",
		visible: false
	});
	
	view.map.add(landslideFL);

	var wildfireFL = new FeatureLayer({
	  portalItem: { id: wildfirePortalID },
	  popupEnabled: true,
	  legendEnabled: true,
	  title: "",
	  visible: false,
	  popupTemplate: {
		title: "Wildfire Area - {FIRE_YEAR}",
		expressionInfos: [
		  {
			name: "area_ha",
			title: "Area (ha)",
			expression: "Round($feature.Shape__Area / 10000)"
		  }
		],
		content: [
		  {
			type: "text",
			text: `
			  <b>Fire Year:</b> {FIRE_YEAR}<br>
			  <b>Area:</b> {expression/area_ha} hectares
			`
		  }
		]
	  }
	});

	
	view.map.add(wildfireFL);

	const legend = new Legend({
		view: view,
		container: "legendContainer",
		layerInfos: [
		  {
			layer: barriersFL,
		  },
		  {
			layer: facilitiesFL,
		  },
		{
			layer: floodFL,
		  },
	
		{
			layer: closuresFL,
		},
		{
			layer: landslideFL,
		},	
		{
			layer: wildfireFL
		}
		  // Don't include routesFL here so that it doesnt show up in the legend
		]
	  });

	function applyQuantileRenderer(selectedField) {
		
	closuresFL.visible = false;
		
	  closuresFL.queryFeatures({
		where: closuresFL.definitionExpression,
		outFields: [selectedField],
		returnGeometry: false
	  }).then((result) => {
		const values = result.features
		  .map(f => f.attributes[selectedField])
		  .filter(v => typeof v === 'number' && !isNaN(v))
		  .sort((a, b) => a - b);

		const n = values.length;
		if (n < 8) {
		  console.warn("Not enough valid data to calculate 8 quantiles.");
		  return;
		}

		const minValue = values[0];
		const maxValue = values[n - 1];

		function getQuantile(q) {
		  const pos = q * (n - 1);
		  const base = Math.floor(pos);
		  const rest = pos - base;
		  return (base + 1 < n)
			? values[base] + rest * (values[base + 1] - values[base])
			: values[base];
		}

		const quantiles = [];
		for (let i = 1; i < 8; i++) {
		  quantiles.push(getQuantile(i / 8));
		}

		const uniqueBreaks = [minValue];
		quantiles.forEach(q => {
		  if (q > uniqueBreaks[uniqueBreaks.length - 1]) {
			uniqueBreaks.push(q);
		  }
		});
		if (maxValue > uniqueBreaks[uniqueBreaks.length - 1]) {
		  uniqueBreaks.push(maxValue);
		}

		const colors = [
		  "#f2e5f7", "#e3cbe9", "#d4b1db", "#c596cd",
		  "#b67cbf", "#a762b1", "#9848a3", "#a414b4"
		];

		const classBreakInfos = [];
		for (let i = 0; i < uniqueBreaks.length - 1; i++) {
		  const min = Math.round(uniqueBreaks[i]);
		  const max = Math.round(uniqueBreaks[i + 1]);
		  classBreakInfos.push({
			minValue: min,
			maxValue: max,
			symbol: {
			  type: "simple-line",
			  color: colors[i % colors.length],
			  width: 1.5 + i  // progressively thicker
			},
			label: `${min} – ${max}`
		  });
		}

		// Extract the prefix before '_' in the field name
		let fieldPrefix = selectedField.split('_')[0];

		if (fieldPrefix === "Grand") {
		  fieldPrefix = "All Types";  // Change the fieldPrefix to "All Types"
		}

		// Set the legend title 
		const legendTitle = `Number of Road Closures – ${fieldPrefix}`;

		  
		closuresFL.renderer = {
		  type: "class-breaks",
		  field: selectedField,
		  legendOptions: {
			title: legendTitle
		  },
		  classBreakInfos: classBreakInfos
		};
		
		closuresFL.visible = true;

		console.log("Applied quantile renderer with breaks:", classBreakInfos);
	  });
	}

	floodFL.visible = false;
	landslideFL.visible = false;
	wildfireFL.visible = false;
	closuresFL.visible = false;

	// Function to clear all hazard layers
	function clearHazardLayers() {
		floodFL.visible = false;
		closuresFL.visible = false;
		landslideFL.visible = false;
		wildfireFL.visible = false;
	}

	// Function to reset legend to only the active hazard layer
	function updateHazardLegend(activeLayer) {
	  legend.layerInfos = legend.layerInfos.filter(info =>
		info.layer !== floodFL && info.layer !== closuresFL && info.layer !== landslideFL && info.layer !== wildfireFL
	  );

	  if (activeLayer) {
		legend.layerInfos.push({ layer: activeLayer });
	  }

	  updateLegendVisibility();
	}
	
	document.getElementById("hazardSelector").addEventListener("change", function () {
	  const selected = this.value;

	  closuresFL.visible = false;

	  if (["Grand_Total", "Fire_Rollup", "Flooding_Rollup", "Landslide_Rollup", "Smoke_Rollup", "Snow_Avalanche_Cold_Rollup"].includes(selected)) {
		closuresFL.visible = true;
		closuresFL.definitionExpression = `${selected} > 0`;
		applyQuantileRenderer(selected);
		updateHazardLegend(closuresFL);
	  } else {
		updateHazardLegend(null);
	  }
		updateHazardDescriptions(); 
	});



	// function to check if any legend layers are visible
	function updateLegendVisibility() {
	  const hasVisibleLayers = legend.layerInfos.some(info => {
		return info.layer.visible;
	  });

	  const legendDiv = document.getElementById("legendContainer");
	  if (hasVisibleLayers) {
		legendDiv.style.display = "block"; // Show the legend
	  } else {
		legendDiv.style.display = "none"; // Hide the legend
	  }
	}

	// Watch for changes in the layers' visibility
	legend.layerInfos.forEach(info => {
	  info.layer.watch("visible", updateLegendVisibility);
	});

	// Initial check
	updateLegendVisibility();

	function updateHazardDescriptions() {
	  const selectedHazard = document.getElementById("hazardSelector").value;
	  const descriptionBox = document.getElementById("hazardDescription");
	  const descriptionText = document.getElementById("hazardDescriptionText");

	  const bulletList = [];

	  // Closure dropdown selection
	  if (selectedHazard && hazardDescriptions[selectedHazard]) {
		bulletList.push(`<li>${hazardDescriptions[selectedHazard]}</li>`);
	  }

	  // Checkboxes
	  const checkboxLayerPairs = [
		{ id: "chkFlood", key: "flood" },
		{ id: "chkLandslide", key: "landslide" },
		{ id: "chkWildfire", key: "wildfire" }
	  ];

	  checkboxLayerPairs.forEach(({ id, key }) => {
		const checkbox = document.getElementById(id);
		if (checkbox.checked && hazardDescriptions[key]) {
		  bulletList.push(`<li>${hazardDescriptions[key]}</li>`);
		}
	  });

	  if (bulletList.length > 0) {
		descriptionBox.style.display = "block";
		descriptionText.innerHTML = `<ul style="padding-left: 20px; margin: 0;">${bulletList.join("")}</ul>`;
	  } else {
		descriptionBox.style.display = "none";
		descriptionText.textContent = "";
	  }
	}

	function updateLegendLayer(layer, isChecked) {
	  const currentLayers = legend.layerInfos
		.filter(info => info.layer !== layer); // Remove if already exists

	  if (isChecked) {
		currentLayers.push({ layer }); // Re-add if checked
	  }

	  legend.layerInfos = currentLayers;  // Reassign to trigger reactivity
	  legend.scheduleRender();            // Ensure UI refresh
	}
	// Enhanced checkbox setup with description updates
	function setupHazardCheckbox(id, layer, descriptionKey) {
	  const checkbox = document.getElementById(id);

	  checkbox.addEventListener("change", function () {
		const isChecked = this.checked;
		layer.visible = isChecked;
		updateLegendLayer(layer, isChecked);
		updateLegendVisibility();
		updateHazardDescriptions();
	  });
	}

	
setupHazardCheckbox("chkFlood", floodFL, "flood");
setupHazardCheckbox("chkLandslide", landslideFL, "landslide");
setupHazardCheckbox("chkWildfire", wildfireFL, "wildfire");

/////////////////////////////////////////////////////////////////////////////////////

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
    const allRRValues = [...new Set(results.features.map(f => f.attributes.Route_Ranking))];
	  const rrValues = Object.keys(routeRankingStyles).filter(val => allRRValues.includes(val));
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
      lineSymbol.style.backgroundColor = routeRankingStyles[val] || "#999";

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
	  label.textContent = routeRankingDisplayNames[val] || val;
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
    .map(cb => `'${cb.value.replace(/'/g, "''")}'`);

  const selectedOD = selectedODRoute?.replace(/'/g, "''");

  if (selectedOD && selectedOptions.length) {
    const routeExpr = `OD_Route = '${selectedOD}' AND Route_Ranking IN (${selectedOptions.join(",")})`;
    console.log("routesFL where clause:", routeExpr);

    routesFL.definitionExpression = routeExpr;
    routesFL.visible = true;

    const query = routesFL.createQuery();
    query.where = routeExpr;
    query.outFields = ["Route_ID", "Route_Ranking", "RouteLength_KM"];
    query.returnGeometry = false;

    routesFL.queryFeatures(query).then((response) => {
      const features = response.features;

      if (!features.length) {
        console.warn("No matching routes found. Hiding barriers.");
        barriersFL.definitionExpression = "1=0";
        barriersFL.visible = false;
        barriersFL.refresh();
        document.getElementById("routeSummaryList").innerHTML = "";
        return;
      }

      // Build route summary table
      const summaryContainer = document.getElementById("routeSummaryList");
      summaryContainer.innerHTML = "";

      features.sort((a, b) => a.attributes.Route_Ranking.localeCompare(b.attributes.Route_Ranking));
      const displayedRankings = new Set();

      const table = document.createElement("table");
      table.className = "route-summary-table";

      const thead = document.createElement("thead");
      thead.innerHTML = "<tr><th>Route</th><th>Length (km)</th></tr>";
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      features.forEach(f => {
        const ranking = f.attributes.Route_Ranking;
        const length_km = (f.attributes.RouteLength_KM).toFixed(1);

        if (!displayedRankings.has(ranking)) {
          const row = document.createElement("tr");

          const rankingCell = document.createElement("td");
          rankingCell.textContent = ranking;
          rankingCell.style.color = routeRankingStyles[ranking] || "#333";

          const lengthCell = document.createElement("td");
          lengthCell.textContent = `${length_km}`;

          row.appendChild(rankingCell);
          row.appendChild(lengthCell);
          tbody.appendChild(row);

          displayedRankings.add(ranking);
        }
      });

      table.appendChild(tbody);
      summaryContainer.appendChild(table);

      // Filter barriersFL based on Route_ID + Route_Ranking
      const routeIDs = [...new Set(features.map(f => `'${f.attributes.Route_ID.replace(/'/g, "''")}'`))];
      const routeRankings = [...new Set(features.map(f => `'${f.attributes.Route_Ranking.replace(/'/g, "''")}'`))];

      if (routeIDs.length && routeRankings.length) {
        const barrierExpr = `Route_ID IN (${routeIDs.join(",")}) AND Route_Ranking IN (${routeRankings.join(",")})`;
        console.log("barriersFL where clause:", barrierExpr);

        barriersFL.definitionExpression = barrierExpr;

        barriersFL.when(() => {
          barriersFL.queryFeatureCount().then(count => {
            console.log("Barriers feature count:", count);
            barriersFL.visible = count > 0;

            // Ensure it is added to the legend if not already
            const alreadyInLegend = legend.layerInfos.some(info => info.layer === barriersFL);
            if (!alreadyInLegend) {
              legend.layerInfos.push({ layer: barriersFL });
            }

            barriersFL.refresh().then(() => {
              view.whenLayerView(barriersFL).then(layerView => {
                layerView.refresh();
              });
            });
          });
        });
      } else {
        console.warn("No valid route IDs or rankings for barrier filter.");
        barriersFL.definitionExpression = "1=0";
        barriersFL.visible = false;
        barriersFL.refresh();
      }
    });
  } else {
    console.warn("No OD Route or Route Rankings selected.");
    routesFL.visible = false;
    barriersFL.definitionExpression = "1=0";
    barriersFL.visible = false;
    barriersFL.refresh();
    document.getElementById("routeSummaryList").innerHTML = "";
  }
}
});