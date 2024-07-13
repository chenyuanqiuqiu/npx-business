const WXAPI = require("apifm-wxapi");
const AUTH = require("../../utils/auth");

const app = getApp();
Page({
  data: {
    type: "",
  },
  selectTap: function (e) {
    console.log(e);
    var id = e.currentTarget.dataset.id;
    WXAPI.updateAddress({
      token: wx.getStorageSync("token"),
      id: id,
      isDefault: "true",
    }).then(function (res) {
      wx.navigateBack({ delta: 1 });
    });
  },

  addAddess: function () {
    wx.navigateTo({
      url: "/pages/addressAdd/index",
    });
  },

  editAddess: function (e) {
    console.log(e);

    wx.navigateTo({
      url: "/pages/addressAdd/index?id=" + e.currentTarget.dataset.id,
    });
  },

  onLoad(e) {},
  onShow() {
    AUTH.checkHasLogined().then((isLogined) => {
      if (isLogined) {
        this.initShippingAddress();
      } else {
        AUTH.login(this);
      }
    });
  },
  async initShippingAddress() {
    wx.showLoading({
      title: "",
    });
    const res = await WXAPI.queryAddress(wx.getStorageSync("token"));
    wx.hideLoading({
      success: (res) => {},
    });
    if (res.code == 0) {
      this.setData({
        addressList: res.data,
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null,
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
    }
  },
  onPullDownRefresh() {
    this.initShippingAddress();
    wx.stopPullDownRefresh();
  },
});
