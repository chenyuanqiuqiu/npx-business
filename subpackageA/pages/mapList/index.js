var $ = require("../../../utils/conf.js");
var city = require("../../../utils/city.js");
var amapFile = require("../../../utils/amap-wx.js");
/***************
 * 此处为高德地图小程序的key
 ****************/
var map = new amapFile.AMapWX({
  key: "698b926da9fe9116c5422e7fd4ad5857",
});

Page({
  data: {
    //城市下拉
    citySelected: "上海市",
    city: "上海市",
    cityData: {},
    hotCityData: [],
    _py: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "J",
      "K",
      "L",
      "M",
      "N",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "W",
      "X",
      "Y",
      "Z",
    ],
    Mstart: "",
    //搜索列表
    inputVal: "",
    searchList: [],
    cityListShow: false,
    inputListShow: false,
    hidden: true,
    showPy: "★",
    //搜索历史记录
    historyListShow: true,
    historyList: [],
  },
  onLoad: function () {
    this.setData({
      historyList:
        wx.getStorageSync("historyList").length > 0
          ? wx.getStorageSync("historyList")
          : [],
    });

    this.setData({
      // citySelected: myCity,
      // city: myCity,
      latitude: wx.getStorageSync("latitude"),
      longitude: wx.getStorageSync("longitude"),
      sname: "我的位置",
      saddress: "上海市浦东新区",
    });

    this.setData({
      cityData: city.all,
      hotCityData: city.hot,
    });
  },
  onShow() {
    this.getLocationNow();
  },
  select(event) {
    let data = event.currentTarget.dataset;
    let query = event.currentTarget.dataset;
    query.POIlongitude = query.poilocation.split(",")[0];
    query.POIlatitude = query.poilocation.split(",")[1];
    wx.setStorageSync("addressName", data.name);
    wx.setStorageSync("latitude", data.latitude);
    wx.setStorageSync("longitude", data.longitude);
    let history = $.saveHistory(wx.getStorageSync("historyList"), query);
    this.setData({
      historyList: history,
    });
    wx.setStorageSync("historyList", history);
    wx.switchTab({
      url: "/pages/index/index",
    });
    //历史记录
  },
  getLocation(){
    wx.getLocation({
      type: "wgs84",
      success(res) {
        console.log("----地址----", res);
        wx.setStorageSync("latitude", res.latitude);
        wx.setStorageSync("longitude", res.longitude);
        map.getRegeo({
          location: res.longitude + "," + res.latitude,
          success(ele) {
            //成功后的回调
            if (ele.length > 0) {
              let data = ele[0].regeocodeData;
              that.setData({
                city: data.addressComponent.city,
                citySelected: data.addressComponent.city,
                latitude: res.latitude,
                longitude: res.longitude,
                saddress: data.formatted_address,
                sname: data.addressComponent.province,
              });
            }
          },
          fail: function (error) {
            console.error(error);
          },
          complete: function (res) {
            console.log(res);
          },
        });
      },
    });
  },
  getLocationNow() {
    let that = this;
    if (wx.getSetting.authSetting['scope.userLocation']) {
      that.getLocation();
    } else {
      wx.showModal({
        title: "授权提示",
        content: "检测到您未开启地理位置权限，是否前往开启？",
        showCancel: true,
        confirmText: "前往开启",
        success(res) {
          if (res.confirm) {
            wx.authorize({
              scope: 'scope.userLocation',
              success(){
                that.getLocation();
              }
            })
          }
        },
      });
    }
  },
  //搜索关键字
  keyword(keyword) {
    var that = this;
    $.map.getInputtips({
      keywords: keyword,
      location: that.data.longitude + "," + that.data.latitude,
      success: function (data) {
        if (data && data.tips) {
          var searchList = data.tips.filter((item) => {
            return typeof item.location != "undefined";
          });
          that.setData({
            searchList: searchList,
          });
        }
      },
    });
  },

  //打开城市列表
  openCityList() {
    let cityListShow = !this.data.cityListShow;
    this.setData({
      cityListShow: cityListShow,
      inputListShow: !cityListShow,
      historyListShow: !cityListShow,
    });
  },

  //选择城市
  selectCity(e) {
    var dataset = e.currentTarget.dataset;
    this.setData({
      citySelected: dataset.fullname,
      cityListShow: false,
      inputListShow: false,
      historyListShow: true,
      location: {
        latitude: dataset.lat,
        longitude: dataset.lng,
      },
    });
  },
  touchstart(e) {
    this.setData({
      index: e.currentTarget.dataset.index,
      Mstart: e.changedTouches[0].pageX,
    });
  },
  touchmove(e) {
    var history = this.data.historyList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 0 ? -move : 0;
    this.setData({
      historyList: history,
    });
  },
  touchend(e) {
    var history = this.data.historyList;
    var move = this.data.Mstart - e.changedTouches[0].pageX;
    history[this.data.index].x = move > 100 ? -180 : 0;
    this.setData({
      historyList: history,
    });
  },
  //获取文字信息
  getPy(e) {
    this.setData({
      hidden: false,
      showPy: e.target.id,
    });
  },

  setPy(e) {
    this.setData({
      hidden: true,
      scrollTopId: this.data.showPy,
    });
  },

  //滑动选择城市
  tMove(e) {
    var y = e.touches[0].clientY,
      offsettop = e.currentTarget.offsetTop;

    //判断选择区域,只有在选择区才会生效
    if (y > offsettop) {
      var num = parseInt((y - offsettop) / 12);
      this.setData({
        showPy: this.data._py[num],
      });
    }
  },

  //触发全部开始选择
  tStart() {
    this.setData({
      hidden: false,
    });
  },

  //触发结束选择
  tEnd() {
    this.setData({
      hidden: true,
      scrollTopId: this.data.showPy,
    });
  },
  //清空历史记录
  clearHistory() {
    var that = this;
    wx.showActionSheet({
      itemList: ["清空"],
      itemColor: "#DD4F43",
      success: function (res) {
        if (res.tapIndex == 0) {
          that.setData({
            historyList: [],
          });
          wx.setStorageSync("historyList", []);
        }
      },
    });
  },
  //删除某一条
  del(e) {
    var that = this;
    wx.showActionSheet({
      itemList: ["删除"],
      itemColor: "#DD4F43",
      success: function (res) {
        if (res.tapIndex == 0) {
          var index = e.currentTarget.dataset.index,
            history = that.data.historyList;
          history.splice(index, 1);
          that.setData({
            historyList: history,
          });
          wx.setStorageSync("historyList", history);
        }
      },
    });
  },
  //输入
  input(e) {
    if (e.detail == "") {
      this.setData({
        inputVal: e.detail,
        inputListShow: false,
        cityListShow: false,
        historyListShow: true,
      });
    } else {
      this.setData({
        inputVal: e.detail,
        inputListShow: true,
        cityListShow: false,
        historyListShow: false,
      });
      this.keyword(this.data.citySelected + e.detail);
    }
  },

  //清除输入框
  clear() {
    this.setData({
      inputVal: "",
      inputListShow: false,
      historyListShow: true,
    });
  },
});
