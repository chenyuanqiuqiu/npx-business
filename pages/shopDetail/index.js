const APP = getApp();
const WXAPI = require("apifm-wxapi");
const tool = require("../../utils/tools.js");
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isSticky:false,
    info: 0,
    active: "one",
    nameLike: "",
    hide_good_box: true,
    feiBox: "",
    id: "",
    shopDetail: null,
    categories: [],
    activeCategory: 0,
    categorySelected: {
      name: "",
      id: "",
    },
    currentGoods: [],
    onLoadStatus: true,
    scrolltop: 0,
    totalPage: 0,

    skuCurGoods: undefined,
    page: 1,
    pageSize: 20,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      id: options.id,
    });
    this.categories();
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
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      createTabs: true, //绘制tabs
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject, //小程序胶囊信息
    });
    this.getDetail();
    this.categories();
    this.shippingCarInfo();
    wx.showTabBar();
  },
  bindconfirm(e) {
    this.setData({
      nameLike: e.detail,
      page: 1,
    });
    this.getGoodsList("sousuo");
  },
  clickTab(e){
    let active = e.currentTarget.dataset.tab;
    this.setData({
      active
    })

  },
  async categories() {
    wx.showLoading({
      title: "",
    });
    let shopId = this.data.id;
    const res = await WXAPI.goodsCategoryV2(shopId);
    wx.hideLoading();
    let activeCategory = 0;
    let categorySelected = this.data.categorySelected;
    if (res.code == 0) {
      const categories = res.data.filter((ele) => {
        return !ele.vopCid1 && !ele.vopCid2;
      });
      categories.forEach((p) => {
        p.childs = categories.filter((ele) => {
          return p.id == ele.pid;
        });
      });
      const firstCategories = categories.filter((ele) => {
        return ele.level == 1;
      });
      if (this.data.categorySelected.id) {
        activeCategory = firstCategories.findIndex((ele) => {
          return ele.id == this.data.categorySelected.id;
        });
        categorySelected = firstCategories[activeCategory];
      } else {
        categorySelected = firstCategories[0];
      }
      const resAd = await WXAPI.adPosition("category_" + categorySelected.id);
      let adPosition = null;
      if (resAd.code === 0) {
        adPosition = resAd.data;
      }
      this.setData({
        page: 1,
        activeCategory,
        categories,
        firstCategories,
        categorySelected,
        adPosition,
      });
      this.getGoodsList();
    }
  },
  async getGoodsList(val) {
    if (this.data.categoryMod == 2) {
      return;
    }
    wx.showLoading({
      title: "",
    });
    // secondCategoryId
    let categoryId = "";
    if (val == "sousuo") {
      categoryId = "";
    } else if (this.data.categorySelected.id) {
      categoryId = this.data.categorySelected.id;
    }
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.goodsv2({
      categoryId,
      page: this.data.page,
      shopId: this.data.id,
      nameLike: this.data.nameLike,
      pageSize: this.data.pageSize,
    });
    wx.hideLoading();
    if (res.code == 700) {
      if (this.data.page == 1) {
        this.setData({
          currentGoods: null,
        });
      } else {
        wx.showToast({
          title: "没有更多了",
          icon: "none",
        });
      }
      return;
    }
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
      return;
    }
    if (this.data.page == 1) {
      this.setData({
        currentGoods: res.data.result,
        totalPage: res.data.totalPage,
      });
    } else {
      this.setData({
        currentGoods: this.data.currentGoods.concat(res.data.result),
        totalPage: res.data.totalPage,
      });
    }
  },
  navbackto() {
    wx.navigateBack({
      delta: 1,
    });
  },
  async shippingCarInfo() {
    const token = wx.getStorageSync("token");
    if (!token) {
      return;
    }
    var res = await WXAPI.shippingCarInfo(token);
    if (res.code == 0) {
      let data = res.data.items.filter((ele) => {
        return ele.shopId == this.data.id;
      });
      if (data && data.length > 100) {
        this.setData({
          info: "99+",
        });
      } else {
        this.setData({
          info: data.length,
        });
      }
    }
  },
  toCart() {
    wx.switchTab({
      url: "/pages/shopCart/index",
    });
  },
  async onCategoryClick(e) {
    const idx = e.target.dataset.idx;
    if (idx == this.data.activeCategory) {
      this.setData({
        scrolltop: 0,
      });
      return;
    }
    const categorySelected = this.data.firstCategories[idx];
    const res = await WXAPI.adPosition("category_" + categorySelected.id);
    let adPosition = null;
    if (res.code === 0) {
      adPosition = res.data;
    }
    this.setData({
      page: 1,
      secondCategoryId: "",
      activeCategory: idx,
      categorySelected,
      scrolltop: 0,
      adPosition,
    });
    this.getGoodsList();
  },
  async addShopCar(e) {
    const curGood = this.data.currentGoods.find((ele) => {
      return ele.id == e.currentTarget.dataset.id;
    });
    if (!curGood) {
      return;
    }
    if (curGood.stores <= 0) {
      wx.showToast({
        title: "已售罄~",
        icon: "none",
      });
      return;
    }
    if (!curGood.propertyIds && !curGood.hasAddition) {
      // 直接调用加入购物车方法
      const res = await WXAPI.shippingCarInfoAddItem(
        wx.getStorageSync("token"),
        curGood.id,
        1,
        []
      );
      if (res.code == 30002) {
        // 需要选择规格尺寸
        this.setData({
          skuCurGoods: curGood,
        });
      } else if (res.code == 0) {
        this.shippingCarInfo();
        wx.showToast({
          title: "加入成功",
          icon: "success",
        });
        wx.showTabBar();
      } else {
        wx.showToast({
          title: res.msg,
          icon: "none",
        });
      }
    } else {
      // 需要选择 SKU 和 可选配件
      this.setData({
        skuCurGoods: curGood,
      });
    }
  },
  goodsGoBottom() {
    if (this.data.page < this.data.totalPage) {
      this.data.page++;
      this.getGoodsList();
    }
  },
  async getDetail() {
    let id = this.data.id;
    const res = await WXAPI.shopSubdetail(id);
    if (res.code == 0) {
      this.setData({
        shopDetail: res.data.info,
      });
    }
  },
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.shopDetail.linkPhone, //仅为示例，并非真实的电话号码
    });
  },
  goMap() {
    const latitude = this.data.shopDetail.latitude;
    const longitude = this.data.shopDetail.longitude;
    wx.openLocation({
      latitude,
      longitude,
      scale: 18,
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getDetail();
    this.setData({
      page: 1,
    });
    this.getGoodsList();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
