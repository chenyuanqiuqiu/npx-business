// pages/login/login.js
import Toast from "@vant/weapp/toast/toast";
const AUTH = require("../../utils/auth.js");

Page({
  /**
   * 页面的初始数据
   */
  data: {
    checked: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},
  loginConfirm() {
    if (this.data.checked) {
      AUTH.authorize().then((res) => {
        if (res.code == 0) {
          wx.reLaunch({
            url: "/pages/index/index",
          });
        }
      });
    } else {
      Toast({
        type: "fail",
        message: "请先阅读并同意协议内容~",
      });
    }
  },
  getPhoneNumber(e) {
    console.log(e);
  },
  onChange(e) {
    console.log(e);
    this.setData({
      checked: e.detail,
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
