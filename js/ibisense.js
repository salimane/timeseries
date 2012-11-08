var plot;
$(function () {
  
    //have to go the metal way didn't know jquery ajax could fetch csv files properly
    var ajax = function(url) {
        request = new(window.ActiveXObject || XMLHttpRequest)("Microsoft.XMLHTTP");
        request.open("GET", url, 0);
        request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        request.send();
        return request.responseText;
    };
  
    var options = { 
        series: {
          lines:  { show: true, fill: true, steps: true},
          shadowSize: 0 
        },
        crosshair: { mode: "x" },
        grid: { hoverable: true, clickable: true, autoHighlight: false },
        points: { show: false },
        xaxes:  [ { mode: 'time' } ],
        yaxes:  [ 
                    { min: 0 },
                    {
                        // align if we are to the right
                        alignTicksWithAxis: 1,
                        position: "right"
                    } 
                ],
        legend: { show: true, position: 'sw' },
        zoom: { interactive: true },
        pan: { interactive: true }
    };

    var data = [];
    var alreadyFetched = {};    
    var placeholder = $("#placeholder");
    var choiceContainer = $("#choices");
    
    
    plot = $.plot(placeholder, data, options);
    
    $("input.dataUpdate").click(function () {
        
        var button = $(this);
        
        //var dataurl = button.siblings('a').attr('href');

        function onDataReceived(result) {
          
            var series = {};
            series.data = $.csv.toArrays(result, {
                onParseValue: $.csv.hooks.castToScalar
            });
            
            series.label = series.data[0][1];
            series.data.splice(0, 1);
            
            var length = series.data.length;
            for (var i = 0; i < length; i++) {
                series.data[i][0] = new Date(series.data[i][0]).getTime();              
            }            

            // let's add it to our current data
            if (!alreadyFetched[series.label]) {
                alreadyFetched[series.label] = true;                
                data.push(series);
            }            
            
         }
        
        if (data.length <= 0) {
          var dataurls = ["data/t.csv", "data/h.csv"]          
          for (var i = 0; i < dataurls.length; i++) {
              onDataReceived(ajax(dataurls[i]));
              
              // insert checkboxes 
              choiceContainer.append('<br/><input type="checkbox" name="' + i +
                '" checked="checked" id="id' + i + '">' +
                '<label for="id' + i + '">'
                 + data[i].label + '</label>');
              
              // hard-code color indices to prevent them from shifting when
              // turned on/off
              data[i].label += " = 0";
              data[i].color = i;
          }
        }        
        
        choiceContainer.find("input").click(plotAccordingToChoices);
        
        function plotAccordingToChoices() {
            var datas = [];

            choiceContainer.find("input:checked").each(function () {
                var key = $(this).attr("name");
                if (key && data[key]) {
                    datas.push(data[key]);
                }
            });

            if (datas.length > 0) {
              if (datas.length == 2) {
                  datas[1].yaxis = 2;
              }
              plot = $.plot(placeholder, datas, options);

              // add zoom out button 
              $('<div class="button" style="right:50px;top:20px">zoom out</div>').appendTo(placeholder).click(function (e) {
                  e.preventDefault();
                  plot.zoomOut();
              });
              
              /*/ add zoom in button 
              $('<div class="button" style="right:50px;top:50px">zoom in &nbsp;</div>').appendTo(placeholder).click(function (e) {
                  e.preventDefault();
                  plot.zoomIn();
              });*/
              
              var legends = $("#placeholder .legendLabel");
              legends.each(function () {
                  // fix the widths so they don't jump around
                  $(this).css('width', $(this).width());
              });
              
              var updateLegendTimeout = null;
              var latestPosition = null;
              
              function updateLegend() {
                  updateLegendTimeout = null;
                  
                  var pos = latestPosition;
                  
                  var axes = plot.getAxes();
                  if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                      pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                      return;
                  }

                  var i, j, dataset = plot.getData();
                  for (i = 0; i < dataset.length; ++i) {
                      var series = dataset[i];

                      // find the nearest points, x-wise
                      for (j = 0; j < series.data.length; ++j)
                          if (series.data[j][0] > pos.x) {
                              break;
                          }
                      
                      // now interpolate
                      var y, p1 = series.data[j - 1], p2 = series.data[j];
                      if (p1 == null) {
                          y = p2[1];
                      }
                      else if (p2 == null) {
                          y = p1[1];
                      }
                      else {
                          y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
                      }
                      if (!isNaN(y)) {
                          legends.eq(i).text(series.label.replace(/=.*/, "= " + y.toFixed(2)));
                      }
                  }
              }
              
              placeholder.bind("plothover",  function (event, pos, item) {
                  latestPosition = pos;
                  if (!updateLegendTimeout) {
                      updateLegendTimeout = setTimeout(updateLegend, 50);
                  }
              });
            }
        }

        plotAccordingToChoices();
        
        
        /*$.ajax({
            url: dataurl,
            type: "GET",
            dataType: "application/x-www-form-urlencoded",
            success: onDataReceived
        });*/
        
    });
    
    
});
