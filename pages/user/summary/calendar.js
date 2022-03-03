NKC.modules.SummaryCalender = function(dom, year) {
  var self = this;
  self.dom = $(dom);
  self.uid = self.dom.attr("data-uid");
  self.createYearList = function(toc) {
    var registerYear = new Date(toc).getFullYear();
    var nowYear = new Date().getFullYear();
    var select = $("<select onchange='SummaryCalendar.setYear(this.value)'></select>");
    for(var i = nowYear; i >= registerYear; i--) {
      var option;
      if(i === self.year) {
        option = $("<option value='"+i+"' selected='true'>"+i+"</option>");
      } else {
        option = $("<option value='"+i+"'>"+i+"</option>");
      }
      
      select.append(option);
    }
    self.dom.append(select);
  };
  self.setYear = function(year) {
    if(year) year = parseInt(year);
    self.year = year || new Date().getFullYear();
    self.begin = (new Date(self.year + "-1-1 00:00:00")).getTime();
    self.end = (new Date((self.year + 1) + "-1-1 00:00:00")).getTime();
    self.getData();
  };
  self.getData = function() {
    nkcAPI("/u/" + self.uid + "/profile/summary/calendar?year=" + self.year, "GET")
      .then(function(data) {
        self.initEcharts(data.posts);
        self.createYearList(data.targetUser.toc);
      })
      .catch(sweetError);
  };
  self.initEcharts = function(data) {
    if(self.myChart && self.myChart.dispose) {
      self.myChart.dispose();
    }
    var timeObj = {};
    for(var i = 0; i < data.length; i++) {
      var t = data[i];
      timeObj[t._id] = t.count;
    }
    var times = {};
    for(var i = self.begin; i < self.end ; i = i + 24*60*60*1000) {
      var timeName = NKC.methods.format("YYYY-MM-DD", i);
      times[NKC.methods.format("YYYY-MM-DD", i)] = timeObj[timeName] || 0;
    }
    data = [];
    var max = 0;
    for(var i in times) {
      if(!times.hasOwnProperty(i)) continue;
      if(times[i] > max) max = times[i];
      data.push([
        i, times[i]
      ]);
    }
    var start = 1, pieceMax = 10000;
    var defaultPieces = [];
    for(var i = start; i < pieceMax; i = i * 2) {
      defaultPieces.push({
        min: i,
        max: i * 2 - 1
      });
    }
    
    var pieces = [];
    for(var i = 0; i < defaultPieces.length; i++) {
      var p = defaultPieces[i];
      if(max >= p.min) {
        pieces.push(p);
      }
    }
    if(!pieces.length) {
      pieces.push({
        min: 1,
        max: 1
      })
    }
    var option = {
      title: {
        left: 'left',
        subtext: '根据用户发表的文章和回复统计',
        text: self.year + '年发表统计'
      },
      tooltip : {},
      visualMap: [
        {
          type: "piecewise",
          left: 'center',
          orient: 'horizontal',
          top: 65,
          pieces: pieces
        }
      ],
      /*visualMap: {
        min: 1,
        max: maxMap,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        top: 65,
        /!*inRange: {
          color: [
            'rgba(191, 68, 76, 1)',
            'rgba(191, 68, 76, 0.8)',
            'rgba(191, 68, 76, 0.6)',
            'rgba(191, 68, 76, 0.4)',
            'rgba(191, 68, 76, 0.2)'
          ],
        },*!/
        textStyle: {
          color: '#000'
        }
      },*/
      calendar: {
        top: 120,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: self.year,
        /*splitLine: {
          show: false
        },*/
        dayLabel: {
          nameMap: "cn"
        },
        monthLabel: {
          nameMap: "cn"
        },
        splitLine: {
          lineStyle: {
            color: "#666",
            width: 2
          }
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: "#fff",
          color: "#f5f5f5"
        },
        yearLabel: {show: false}
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }
    };
    self.myChart = echarts.init(self.dom[0]);
    self.myChart.setOption(option);
  };
  self.setYear(year);
};
export default NKC.modules.SummaryCalender;