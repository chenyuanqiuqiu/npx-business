//高德小程序SDK
var amapFile = require("amap-wx.js");
/***************
 * 此处为高德地图小程序的key
 ****************/
var map = new amapFile.AMapWX({
  key: "698b926da9fe9116c5422e7fd4ad5857",
});

//公共模块
module.exports = {
  //实例化高德地图
  map: map,
  /***************
   * 此处为高地地图web服务的key
   ****************/
  webKey: "698b926da9fe9116c5422e7fd4ad5857",
  //保存历史记录
  saveHistory(data, query) {
    if (data.length == 0) {
      return [query];
    } else {
      var startName = [],
        endName = [],
        history = data;
      history.forEach(function (item) {
        startName.push(item.sname);
        endName.push(item.name);
      });
      if (
        startName.indexOf(query.sname) < 0 ||
        endName.indexOf(query.name) < 0
      ) {
        history.unshift(query);
      }
      if (history.length > 15) {
        history.length = 15;
      }
      startName = null;
      endName = null;
      return history;
    }
  },
  //格式化距离
  distance: function (dis) {
    return dis < 1000
      ? dis + "米"
      : (dis / 1000).toFixed(2).toString() + "公里";
  },
  //格式化时间
  resultFormat: function (result) {
    var h = Math.floor((result / 3600) % 24);
    var m = Math.floor((result / 60) % 60);
    if (h < 1) {
      return (result = m + "分钟");
    } else {
      return (result = h + "小时" + m + "分钟");
    }
  },
  //驾车，骑行，步行线路
  polyline: function (data) {
    var points = [];
    if (data.paths && data.paths[0] && data.paths[0].steps) {
      var steps = data.paths[0].steps;
      for (var i = 0; i < steps.length; i++) {
        var poLen = steps[i].polyline.split(";");
        for (var j = 0; j < poLen.length; j++) {
          points.push({
            longitude: parseFloat(poLen[j].split(",")[0]),
            latitude: parseFloat(poLen[j].split(",")[1]),
          });
        }
      }
    }
    return points;
  },

  //弹窗
  dialog: function (content, callback) {
    wx.showModal({
      title: "提示",
      content: content,
      showCancel: false,
      success: function (res) {
        if (res.confirm) {
          if (callback) {
            callback();
          }
        }
      },
    });
  },
  //授权地理位置
  getLocation: function (callback) {
    wx.getLocation({
      type: "gcj02",
      success: function () {
        if (callback) {
          callback();
        }
      },
      fail: function () {
        wx.getSetting({
          success: function (res) {
            if (
              !res.authSetting["scope.userInfo"] ||
              !res.authSetting["scope.userLocation"]
            ) {
              wx.openSetting();
            }
          },
        });
      },
    });
  },
};
