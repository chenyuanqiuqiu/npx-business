const WXAPI = require("apifm-wxapi");
const CONFIG = require("../config.js");

async function checkSession() {
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success() {
        return resolve(true);
      },
      fail() {
        return resolve(false);
      },
    });
  });
}
// 检测登录状态，返回 true / false
async function checkHasLogined() {
  const token = wx.getStorageSync("token");
  if (!token) {
    return false;
  }
  const loggined = await checkSession();
  if (!loggined) {
    wx.removeStorageSync("token");
    return false;
  }
  const checkTokenRes = await WXAPI.checkToken(token);
  if (checkTokenRes.code != 0) {
    wx.removeStorageSync("token");
    return false;
  }
  return true;
}

async function wxaCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code);
      },
      fail() {
        wx.showToast({
          title: "获取code失败",
          icon: "none",
        });
        return resolve("获取code失败");
      },
    });
  });
}

async function login(page) {
  const _this = this;
  wx.login({
    success: function (res) {
      let extConfigSync = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
      if (extConfigSync.subDomain) {
        WXAPI.wxappServiceLogin({
          code: res.code,
        }).then(function (res) {
          if (res.code == 10000) {
            // 去注册
            return;
          }
          if (res.code != 0) {
            // 登录错误
            wx.showModal({
              title: "无法登录",
              content: res.msg,
              showCancel: false,
            });
            return;
          }
          wx.setStorageSync("token", res.data.token);
          wx.setStorageSync("uid", res.data.uid);
          if (CONFIG.bindSeller) {
            _this.bindSeller();
          }
          if (page) {
            page.onShow();
          }
        });
      } else {
        WXAPI.login_wx(res.code).then(function (res) {
          if (res.code == 10000) {
            // 去注册
            return;
          }
          if (res.code != 0) {
            // 登录错误
            wx.showModal({
              title: "无法登录",
              content: res.msg,
              showCancel: false,
            });
            return;
          }
          wx.setStorageSync("token", res.data.token);
          wx.setStorageSync("uid", res.data.uid);
          if (CONFIG.bindSeller) {
            _this.bindSeller();
          }
          if (page) {
            page.onShow();
          }
        });
      }
    },
  });
}
async function bindSeller() {
  const token = wx.getStorageSync("token");
  const referrer = wx.getStorageSync("referrer");
  if (!token) {
    return;
  }
  if (!referrer) {
    return;
  }
  const res = await WXAPI.bindSeller({
    token,
    uid: referrer,
  });
}
async function authorize() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: function (res) {
        const code = res.code;
        // 下面开始调用注册接口
        const extConfigSync = wx.getExtConfigSync();
        if (extConfigSync.subDomain) {
          WXAPI.wxappServiceAuthorize({
            code: code,
            referrer: "",
          }).then(function (res) {
            if (res.code == 0) {
              wx.setStorageSync("token", res.data.token);
              wx.setStorageSync("uid", res.data.uid);
              resolve(res);
            } else {
              wx.showToast({
                title: res.msg,
                icon: "none",
              });
              reject(res.msg);
            }
          });
        } else {
          WXAPI.authorize({
            code: code,
            referrer: "",
          }).then(function (res) {
            if (res.code == 0) {
              wx.setStorageSync("token", res.data.token);
              wx.setStorageSync("uid", res.data.uid);
              resolve(res);
            } else {
              wx.showToast({
                title: res.msg,
                icon: "none",
              });
              reject(res.msg);
            }
          });
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

module.exports = {
  checkSession: checkSession,
  checkHasLogined: checkHasLogined,
  wxaCode: wxaCode,
  login: login,
  authorize: authorize,
  bindSeller: bindSeller,
};
