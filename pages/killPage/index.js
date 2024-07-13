const WXAPI = require("apifm-wxapi");
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    page: 1,
    active: 0,
    pageSize: 15,
    totalPage: 0,
    key: "one",
    info: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {},
  handelClick(e) {
    let key = e.currentTarget.dataset.key;
    this.setData({
      key,
    });
  },
  async addShopCar(e) {
    const curGood = this.data.list.find((ele) => {
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
  async getList() {
    const res = await WXAPI.goodsv2({
      categoryId: 453420,
      page: this.data.page,
      pageSize: this.data.pageSize,
    });
    if (res.code == 0) {
      if (this.data.page == 1) {
        this.setData({
          list: res.data.result,
          totalPage: res.data.totalPage,
        });
      } else {
        this.setData({
          list: this.data.list.concat(res.data.result),
          totalPage: res.data.totalPage,
        });
      }
    }
  },
  goodsGoBottom() {
    if (this.data.page < this.data.totalPage) {
      this.data.page++;
      this.getList();
    }
  },
  async shippingCarInfo() {
    const token = wx.getStorageSync("token");
    if (!token) {
      return;
    }
    var res = await WXAPI.shippingCarInfo(token);
    if (res.code == 0) {
      let number = res.data.number;
      if (number && number > 100) {
        this.setData({
          info: "99+",
        });
      } else {
        this.setData({
          info: number,
        });
      }
    }
  },
  toCart() {
    wx.switchTab({
      url: "/pages/shopCart/index",
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getList();
    this.shippingCarInfo();
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
