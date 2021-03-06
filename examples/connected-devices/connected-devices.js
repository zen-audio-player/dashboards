var client = new Keen({
  projectId: "5690c384c1e0ab0c8a6c59c4",
  readKey: "03da022055879f2d36259f1b4ab9e690ea081e8b6bbc3013e8d8c3c80387892ed8f8c9a41c7c4dbfb994b0ce779232c4cfda142be5fe02c0210fef64cd108056b759ec5873c01db269505e9ddce53e65a62573664eb901ff6dbe183bd6033860632e22234e8127976efbe276bd817c19"
});

var geoProject = new Keen({
  projectId: "5690c384c1e0ab0c8a6c59c4",
  readKey: "03da022055879f2d36259f1b4ab9e690ea081e8b6bbc3013e8d8c3c80387892ed8f8c9a41c7c4dbfb994b0ce779232c4cfda142be5fe02c0210fef64cd108056b759ec5873c01db269505e9ddce53e65a62573664eb901ff6dbe183bd6033860632e22234e8127976efbe276bd817c19"
});
// TODO: remove
var removeme = null;
Keen.ready(function(){

  // ----------------------------------------
  // Visitors Timeline
  // ----------------------------------------
  var new_users = new Keen.Query("count", {
    eventCollection: "Playing YouTube video",
    timeframe: "this_31_days",
    interval: "daily"
  });
  geoProject.draw(new_users, document.getElementById("visitors"), {
    chartType: "areachart",
    title: "Monthly Visits",
    height: 300,
    width: 490,
    chartOptions: {
      legend: { position: "none" },
      chartArea: {
        height: "78%",
        top: "15%",
        left: "8%",
        width: "85%"
      },
      hAxis: { format: 'MMM d', maxTextLines: 1 }
    }
  });

  // ----------------------------------------
  // Visitors by Browser Pie chart
  // ----------------------------------------
  var browser = new Keen.Query("count", {
    eventCollection: "Playing YouTube video",
    timeframe: "this_31_days",    
    groupBy: [
      "parsed_user_agent.browser.family"
    ]
  });
  geoProject.draw(browser, document.getElementById("browser"), {
    chartType: "piechart",
    title: "Visits by Browser",
    height: 300,
    width: 475,
    chartOptions: {
      chartArea: {
        height: "78%",
        top: "15%",
        left: "10%",
        width: "100%"
      }
    }
  });

  // ----------------------------------------
  // Visitors by Country
  // ----------------------------------------
  var state = new Keen.Query("count", {
    eventCollection: "Playing YouTube video",
    groupBy: "ip_geo_info.country",
    timeframe: "this_31_days"
  });
  client.draw(state, document.getElementById("geography"), {
    chartType: "piechart",
    title: "Visits by Country",
    height: 300,
    width: 475,
    chartOptions: {
      chartArea: {
        height: "78%",
        top: "15%",
        left: "12%",
        width: "100%"
      }
    }
    // ,
    // labelMapping: {
    //   "New Jersey" : "NJ",
    //   "Virginia" : "VA",
    //   "California": "CA",
    //   "Washington": "WA",
    //   "Utah": "UT",
    //   "Oregon": "OR",
    //   "null": "Other"
    // }
  });

  // TODO: ZAP usage
  var state = new Keen.Query("extraction", {
    eventCollection: "Playing YouTube video",
    timeframe: "this_year",
    property_names: ["title", "author", "youtubeID"]
  });

  var zapUsageTable = new google.visualization.DataTable();
  zapUsageTable.addColumn("string", "Title");
  zapUsageTable.addColumn("string", "Author");
  zapUsageTable.addColumn("string", "Youtube ID");
  zapUsageTable.addColumn("number", "Count");

  client.run(state, function(err, res) {
    if (err) {
        // there was an error!
    }
    else {
        var results = res.result;
        var resultMap = {};
        var output = [];

        // Store unique & counts only
        for (var r in res.result) {
            var cur = res.result[r];
            if (cur.youtubeID) {
                if (resultMap[cur.youtubeID]) {
                    resultMap[cur.youtubeID].count++;
                }
                else {
                    resultMap[cur.youtubeID] = {
                        count: 1,
                        title: cur.title || "",
                        author: cur.author || ""
                    };
                }
            }
        }

        // Back to csv-like data
        for (var r in resultMap) {
            if (resultMap.hasOwnProperty(r)) {
                var cur = resultMap[r];
                output.push([cur.title, cur.author, r, cur.count]);
            }
        }

        zapUsageTable.addRows(output);
        zapUsageTable.sort([{column: 3, desc: true}]);
        zapUsageTable.removeRows(5, Number.MAX_VALUE);
        var zapUsageTableInstance = new google.visualization.Table(document.getElementById('extract-pageviews-table'));
        zapUsageTableInstance.draw(zapUsageTable, {title: "foo", showRowNumber: false, width: '100%', height: '100%'});
    }
  });

  // ----------------------------------------
  // Funnel
  // ----------------------------------------
  var funnel = new Keen.Query("funnel", {
    steps: [
      {
         event_collection: "purchases",
         actor_property: "user.id"
      },
      {
        event_collection: "activations",
        actor_property: "user.id"
      },
      {
        event_collection: "status_update",
        actor_property: "user.id"
      },
      {
        event_collection: "user_action",
        actor_property: "user.id",
        filters: [] // where property "total_sessions" == 2
      },
      {
        event_collection: "user_action",
        actor_property: "user.id",
        filters: [] // where property "action" equals "invited friend"
      }
    ]
  });

  /*  This funnel is built from mock data */
  var sampleFunnel = { result: [ 3250, 3000, 2432, 1504, 321 ], steps: funnel.params.steps };

  new Keen.Dataviz()
    .el(document.getElementById("chart-05"))
    .parseRawData(sampleFunnel)
    .chartType('barchart')
    .chartOptions({
      chartArea: { height: "85%", left: "20%", top: "5%" },
      legend: { position: "none" }
    })
    .colors([Keen.Dataviz.defaults.colors[5]])
    .height(340)
    .labels(["Purchased Device", "Activated Device", "First Session", "Second Session", "Invited Friend"])
    .title(null)
    .render();

  // ----------------------------------------
  // Mapbox - Active Users
  // ----------------------------------------
  var tframe = "previous_7_days";

  var DEFAULTS = {
    coordinates: {
      lat: 37.77350,
      lng: -122.41104
    },
    zoom: 3
  };

  var initialize,
      map,
      markerStart = DEFAULTS.coordinates;

  var activeMapData,
      heat;
      
  function setActiveButton(button) {
    var classButtonNormal = "btn btn-default";
    var classButtonSelected = "btn btn-primary";

    switch (button) {
    default:
    case "7days":
      document.getElementById("7days").className = classButtonSelected;
      document.getElementById("14days").className = classButtonNormal;
      document.getElementById("28days").className = classButtonNormal;
      break;
    case "14days":
      document.getElementById("7days").className = classButtonNormal;
      document.getElementById("14days").className = classButtonSelected;
      document.getElementById("28days").className = classButtonNormal;
      break;
    case "28days":
      document.getElementById("7days").className = classButtonNormal;
      document.getElementById("14days").className = classButtonNormal;
      document.getElementById("28days").className = classButtonSelected;
      break;
    }
  }

  initialize = function() {
    setActiveButton("7days");

    L.mapbox.accessToken = "pk.eyJ1Ijoia2Vlbi1pbyIsImEiOiIza0xnNXBZIn0.PgzKlxBmYkOq6jBGErpqOg";
    map = L.mapbox.map("map", "keen-io.kae20cg0", {
      attributionControl: true,
      center: [markerStart.lat, markerStart.lng],
      zoom: DEFAULTS.zoom
    });

    heat = L.heatLayer([], { maxZoom: 14 });

    activeMapData = L.layerGroup().addTo(map);

    map.attributionControl.addAttribution('<a href="https://keen.io/">Custom Analytics by Keen IO</a>');

    var geoFilter = [];
    geoFilter.push({
      property_name : "keen.location.coordinates",
      operator : "within",
      property_value: {
        coordinates: [ -122.41104, 37.77350 ],
        max_distance_miles: 10
      }
    });

    var scoped_events = new Keen.Query("select_unique", {
      eventCollection: "Playing YouTube video",
      targetProperty: "keen.location.coordinates",
      timeframe: tframe,
      filters: geoFilter
    });
    var result = geoProject.run(scoped_events, function(err, res){
      // console.log("events", res);
      activeMapData.clearLayers();

      Keen.utils.each(res.result, function(coord, index){
        var em = L.marker(new L.LatLng(coord[1], coord[0]), {
          icon: L.mapbox.marker.icon()
        }).addTo(activeMapData);
      });

      activeMapData.eachLayer(function(l) {
          heat.addTo(map).addLatLng(l.getLatLng());
      });
      activeMapData.clearLayers();
    });


    var newgeoFilter = [];
    function resize(geo){

      geo = [];

      heat.setLatLngs([]);

      var center = map.getCenter();
      var zoom = map.getZoom();

      z = zoom-1;
      if (zoom === 0){
        radius = false;
      }
      else {
        radius = 10000/Math.pow(2,z);
      }
      // console.log(center, radius);



      geo.push({
        property_name : "keen.location.coordinates",
        operator : "within",
        property_value: {
          coordinates: [ center.lng, center.lat ],
          max_distance_miles: radius
        }

      });
      return geo;
    }


    map.on('zoomend', function(e) {
      newgeoFilter = resize(newgeoFilter);
      scoped_events.set({ filters: newgeoFilter });
      result.refresh();
    });
    map.on('dragend', function(e) {
      newgeoFilter = resize(newgeoFilter);
      scoped_events.set({ filters: newgeoFilter });
      result.refresh();
    });



    document.getElementById("14days").addEventListener("click", function() {
      setActiveButton("14days");
      newgeoFilter = resize(newgeoFilter);
      scoped_events.set({ filters: newgeoFilter,
                          timeframe: "previous_14_days" });
      result.refresh();
    });

    document.getElementById("28days").addEventListener("click", function() {
      setActiveButton("28days");
      newgeoFilter = resize(newgeoFilter);
      scoped_events.set({ filters: newgeoFilter,
                          timeframe: "previous_28_days" });
      result.refresh();
    });

    document.getElementById("7days").addEventListener("click", function() {
      setActiveButton("7days");
      newgeoFilter = resize(newgeoFilter);
      scoped_events.set({ filters: newgeoFilter,
                          timeframe: "previous_7_days" });
      result.refresh();
    });

  };




initialize();
});
