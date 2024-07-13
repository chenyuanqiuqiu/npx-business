Page({
  data: {},
  onLoad(options) {
    this.setData({
      list: wx.getStorageSync("searchHis"),
    });
  },
  onShow() {},
  search(e) {
    this.setData({
      inputVal: e.detail,
    });
    if (e.detail) {
      let searchHis = wx.getStorageSync("searchHis");
      if (!searchHis) {
        searchHis = [e.detail];
      }
      if (!searchHis.includes(e.detail)) {
        searchHis.push(e.detail);
      }
      wx.setStorageSync("searchHis", searchHis);
      this.setData({
        list: searchHis,
      });
    }
    wx.redirectTo({
      url: "/pages/good/list?name=" + this.data.inputVal,
    });
  },
  toSearch(e) {
    let name = e.currentTarget.dataset.name;
    wx.redirectTo({
      url: "/pages/good/list?name=" + name,
    });
  },
  onClose() {
    wx.setStorageSync("searchHis", null);
    this.setData({
      list: null,
    });
  },
  searchscan() {
    wx.scanCode({
      scanType: ["barCode", "qrCode", "datamatrix", "pdf417"],
      success: (res) => {
        wx.redirectTo({
          url: "/pages/good/list?name=" + res.result,
        });
      },
    });
  },
});
