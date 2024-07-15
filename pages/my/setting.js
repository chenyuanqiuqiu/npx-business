const CONFIG = require("../../config.js");
const WXAPI = require("apifm-wxapi");
const AUTH = require("../../utils/auth");
Page({
  data: {
    enableDebug: wx.getSystemInfoSync().enableDebug,
  },
  onLoad() {
    this.setData({
      version: CONFIG.version,
    });
  },
  onShow() {
    this.getUserApiInfo();
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync("token"));
    if (res.code == 0) {
      let _data = {};
      _data.apiUserInfoMap = res.data;
      if (res.data.base.mobile) {
        _data.userMobile = res.data.base.mobile;
      }
      if (
        this.data.order_hx_uids &&
        this.data.order_hx_uids.indexOf(res.data.base.id) != -1
      ) {
        _data.canHX = true; // 具有扫码核销的权限
      }
      this.setData(_data);
    }
  },
  clearStorage() {
    wx.clearStorageSync();
    wx.showToast({
      title: "已清除",
      icon: "success",
    });
  },
  setEnableDebug() {
    const enableDebug = wx.getSystemInfoSync().enableDebug;
    if (enableDebug) {
      wx.setEnableDebug({
        enableDebug: false,
      });
    } else {
      wx.setEnableDebug({
        enableDebug: true,
      });
    }
  },
  openSetting() {
    wx.openSetting({
      withSubscriptions: true,
    });
  },
});
