const TOOLS = require("../../utils/tools.js");
const WXAPI = require("apifm-wxapi");
const AUTH = require("../../utils/auth");
const APP = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderBy: "",
    secondCategoryId: "",
    totalPage: 0,
    categoryMod: "",
    name: "",
    categories: [],
    isActiveId: 0,
    categorySelected: {
      name: "",
      id: "",
    },
    firstCategories: [],
    currentGoods: [],
    onLoadStatus: true,
    scrolltop: 0,

    skuCurGoods: undefined,
    page: 1,
    pageSize: 20,
    toView: "",
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"],
    });
    this.setData({
      categoryMod: wx.getStorageSync("categoryMod"),
    });
  },
  goSearch() {
    wx.navigateTo({
      url: "/pages/search/index",
    });
  },
  goodsDetailPage(e) {
    const goodsId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/goodsDetails/index?id=" + goodsId,
    });
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject, //小程序胶囊信息
    });
    AUTH.checkHasLogined().then((isLogined) => {
      if (isLogined) {
        TOOLS.showTabBarBadge(); // 获取购物车数据，显示TabBarBadge
      }
    });
    const _categoryId = wx.getStorageSync("_categoryId");
    wx.removeStorageSync("_categoryId");
    if (_categoryId) {
      this.data.categorySelected.id = _categoryId;
    }
    this.categories();
  },
  onCategoryClick(event) {
    console.log(event, "Biaoq------");
    let index = event.currentTarget.dataset.index;
    let isActiveId = event.currentTarget.dataset.id;
    this.setData({
      isActiveId,
      toView: "day-" + isActiveId,
      currentGoods: null,
      secondCategoryId: "",
      categorySelected: this.data.firstCategories[index],
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
        wx.showToast({
          title: "加入成功",
          icon: "success",
        });
        wx.showTabBar();
        TOOLS.showTabBarBadge(); // 获取购物车数据，显示TabBarBadge
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
  handelTap() {},
  async categories() {
    wx.showLoading({
      title: "",
    });
    const res = await WXAPI.goodsCategory();
    wx.hideLoading();
    let activeCategory = 0;
    let categorySelected = this.data.categorySelected.id;
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
      let isActiveId = 0;
      if (this.data.categorySelected.id) {
        activeCategory = firstCategories.findIndex((ele) => {
          return ele.id == this.data.categorySelected.id;
        });
        categorySelected = firstCategories[activeCategory];
        isActiveId = this.data.categorySelected.id;
      } else {
        categorySelected = firstCategories[0];
        isActiveId = categorySelected.id;
      }
      this.setData({
        page: 1,
        activeCategory,
        categories,
        firstCategories,
        categorySelected,
        isActiveId: isActiveId,
        toView: "day-" + isActiveId,
      });
      this.getGoodsList();
    }
  },
  onSecondCategoryClick(e) {
    console.log(e, "000000");
    let index = e.detail;
    let secondCategoryId = "";
    if (index <= 0) {
      secondCategoryId = "";
    } else {
      secondCategoryId = this.data.categorySelected.childs[index - 1].id;
    }
    this.setData({
      secondCategoryId,
      currentGoods: null,
      page: 1,
    });
    this.getGoodsList();
  },
  filter(e) {
    this.setData({
      page: 1,
      orderBy: e.currentTarget.dataset.val,
    });
    this.getGoodsList();
  },
  async getGoodsList() {
    wx.showLoading({
      title: "",
    });
    let categoryId = "";
    if (this.data.secondCategoryId) {
      categoryId = this.data.secondCategoryId;
    } else if (this.data.categorySelected.id) {
      categoryId = this.data.categorySelected.id;
    }
    const res = await WXAPI.goodsv2({
      orderBy: this.data.orderBy,
      categoryId,
      page: this.data.page,
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
  goodsGoBottom() {
    if (this.data.page < this.data.totalPage) {
      this.data.page++;
      this.getGoodsList();
    }
  },
  // 扫码
  searchscan() {
    wx.scanCode({
      scanType: ["barCode", "qrCode", "datamatrix", "pdf417"],
      success: (res) => {
        this.setData({
          inputVal: res.result,
        });
        wx.navigateTo({
          url: "/pages/goods/list?name=" + res.result,
        });
      },
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
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
