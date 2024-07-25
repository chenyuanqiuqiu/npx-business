// index.js
const WXAPI = require("apifm-wxapi");
const TOOLS = require("../../utils/tools.js");
var amapFile = require("../../utils/amap-wx.js");
const APP = getApp();
/***************
 * 此处为高德地图小程序的key
 ****************/
var map = new amapFile.AMapWX({
  key: "698b926da9fe9116c5422e7fd4ad5857",
});

// const MAPWX = require("../../qqmap-wx-jssdk.js");
// var qqmapsdk = new MAPWX({
//   key: "5BDBZ-WGR3L-VZ7P7-MYNVV-ZBZHE-G5F4G", // 必填，填自己在腾讯位置服务申请的key
// });
Page({
  data: {
    addressNow: "",
    totalPage: 0,
    shopList: [],
    latitude: "",
    longitude: "",
    showContent: false,
    adPositionIndexPop: "",
    swiperList: [],
    cmsCategories: [],
    curPage: 0,
    nav_fixed: "",
    scrollTop: 0, //页面滚动距离
    isSticky: false, //是否吸顶
    imageTime:
      "https://img2.baidu.com/it/u=1524584636,1026440004&fm=253&fmt=auto&app=138&f=JPEG?w=796&h=500",
    imageList: [],
    categories: [],
    page: 1,
    pageSize: 10,
    type: "",
  },
  onReady() {
    console.log(".......onReady");
  },
  onLoad() {
    console.log(".......onLoad");
    this.getGoodsCategory(); //获取商品类别
    this.initBanners();
    this.cmsCategories();
    this.adPosition();
  },
  goSearch() {
    wx.navigateTo({
      url: "/pages/search/index",
    });
  },
  async fetchShops() {
    const res = await WXAPI.fetchShops({
      orderBy: "",
      provinceId: "",
      cityId: "",
      categoryId: "",
      type: "",
      page: this.data.page,
      pageSize: this.data.pageSize,
    });
    if (res.code == 0) {
      if (res.data.length > 0) {
        res.data.forEach((element) => {
          element.recommendName = element.recommendStatus == 1 ? "推荐" : "";
        });
        this.setData({
          shopList: res.data,
        });
      }
    }
  },
  onPageScroll(e) {
    this.setData({
      scrollTop: e.scrollTop,
    });
    if (this.data.scrollTop >= 90) {
      this.setData({
        isSticky: true,
      });
    } else {
      this.setData({
        isSticky: false,
      });
    }
  },
  goSearch() {
    wx.navigateTo({
      url: "/pages/search/index",
    });
  },
  goShopDetail(e) {
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/shopDetail/index?id=" + id,
    });
  },
  cmsCategories() {
    // 读取所有的分类数据
    WXAPI.cmsCategories().then((res) => {
      console.log(res);
      if (res.code == 0) {
        let cmsCategories = res.data.filter((ele) => {
          return ele.type == "banner";
        });
        this.setData({ cmsCategories });
      } else {
        wx.showToast({
          title: res.msg,
          icon: "none",
        });
      }
    });
  },
  async initBanners() {
    const _data = {};
    // 读取头部轮播图
    const res1 = await WXAPI.banners({
      type: "manner",
    });
    if (res1.code == 700) {
      wx.showModal({
        title: "提示",
        content: "请在后台添加 banner 轮播图片，自定义类型填写 index",
        showCancel: false,
      });
    } else {
      _data.banners = res1.data;
    }
    this.setData(_data);
  },
  async getSwiperList() {
    const res = await WXAPI.goodsv2({
      page: 1,
      recommendStatus: 1,
      pageSize: 15,
    });

    if (res.code == 0) {
      let data = res.data.result;
      let swiperList = [];
      if (data.length >= 10) {
        swiperList[0] = data.slice(0, 5);
        swiperList[1] = data.slice(5, 10);
        swiperList[2] = data.slice(10, 15);
      } else if (data.length >= 5) {
        swiperList[0] = data.slice(0, 5);
        swiperList[1] = data.slice(5, 10);
      } else {
        swiperList[0] = data.slice(0, 5);
      }
      this.setData({
        swiperList,
      });
      return data;
    }
  },
  onReachBottom: function () {
    this.setData({
      curPage: this.data.page + 1,
    });
    this.fetchShops();
  },
  onPullDownRefresh: function () {
    this.setData({
      page: 1,
    });
    this.fetchShops();
    this.getGoodsCategory();
    wx.stopPullDownRefresh();
  },
  onShow() {
    this.getSwiperList();
    let name = wx.getStorageSync("addressName");
    if (name) {
      this.setData({
        addressNow: name,
        latitude: wx.getStorageSync("latitude"),
        longitude: wx.setStorageSync("longitude"),
      });
    } else {
      this.getSeting();
    }
    // 获取购物车数据，显示TabBarBadge
    TOOLS.showTabBarBadge();
    this.fetchShops();
  },
  async getGoodsCategory() {
    const res = await WXAPI.goodsCategory();
    let categories = [];
    if (res.code == 0) {
      const _categories = res.data.filter((ele) => {
        return ele.level == 1;
      });
      categories = categories.concat(_categories.slice(0, 5));
    }
    this.setData({ categories });
  },
  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/goodsDetails/index?id=${id}`,
    });
  },
  getToLocation() {
    wx.navigateTo({
      url: `/subpackageA/pages/mapList/index`,
    });
  },
  getLocation(){
    let mapObject = null;
    let that = this;
    wx.getLocation({
      type: "wgs84",
      success(res) {
        console.log("----地址----", res);
        wx.setStorageSync("latitude", res.latitude);
        wx.setStorageSync("longitude", res.longitude);
        mapObject = res;
        map.getRegeo({
          location: res.longitude + "," + res.latitude,
          success(ele) {
            console.log(this,'-----this指向')
            //成功后的回调
            if (ele.length > 0) {
              let data = ele[0].regeocodeData;
              that.setData({
                addressNow: data.formatted_address,
                longitude: res.longitude,
                latitude: res.latitude,
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
  getSeting() {
    let that = this;
    wx.getSetting({
      success(res) {
          if (res.authSetting['scope.userLocation']) {
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
      }
    })
  },
  closeAdPositionIndexPop() {
    this.setData({
      adPositionIndexPop: null,
    });
    // 关闭广告位，弹出编辑昵称头像框
    APP.initNickAvatarUrlPOP(this);
  },
  clickAdPositionIndexPop() {
    const adPositionIndexPop = this.data.adPositionIndexPop;
    this.setData({
      adPositionIndexPop: null,
    });
    // 点击广告位，弹出编辑昵称头像框
    APP.initNickAvatarUrlPOP(this);
    if (!adPositionIndexPop || !adPositionIndexPop.url) {
      return;
    }
    wx.navigateTo({
      url: adPositionIndexPop.url,
    });
  },
  tapBanner(id) {},
  async adPosition() {
    let res = await WXAPI.adPosition("indexPop");
    if (res.code == 0) {
      this.setData({
        adPositionIndexPop: res.data,
      });
    } else {
      // 没有广告位，弹出编辑昵称头像框
      APP.initNickAvatarUrlPOP(this);
    }
  },
  tabClick(e) {
    let cid = e.currentTarget.dataset.kindvalue;
    let kind = e.currentTarget.dataset.page;
    if (kind == "detail") {
      wx.setStorageSync("_categoryId", cid);
      wx.switchTab({
        url: "/pages/category/category",
      });
    } else {
      if (cid == "lqzx") {
        wx.navigateTo({
          url: "/pages/coupons/index",
        });
      } else if (cid == "jifensc") {
        wx.navigateTo({
          url: "/pages/jiFenPage/index",
        });
      } else if (cid == "kefu") {
        wx.makePhoneCall({
          phoneNumber: "15678990977", //仅为示例，并非真实的电话号码
        });
      }else{
        Toast.fail('功能正在开发中！');
      }
    }
  },
  topage() {
    wx.navigateTo({
      url: "/pages/killPage/index",
    });
  },
  getItem(e) {},
  handleTap() {
    wx.navigateTo({
      url: "/pages/search/search",
    });
  },
  onUnload() {
    wx.setStorageSync("addressName", null);
  },
});
