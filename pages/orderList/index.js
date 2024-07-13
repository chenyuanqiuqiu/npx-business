const wxpay = require("../../utils/pay.js");
const WXAPI = require("apifm-wxapi");
const AUTH = require("../../utils/auth.js");

Page({
  data: {
    page: 1,
    tabIndex: 0,
    statusType: [
      {
        status: 9999,
        label: "全部",
      },
      {
        status: 0,
        label: "待付款",
      },
      {
        status: 1,
        label: "待发货",
      },
      {
        status: 2,
        label: "待收货",
      },
      {
        status: 3,
        label: "待评价",
      },
    ],
    status: 9999,
    hasRefund: false,
    badges: [0, 0, 0, 0, 0],
  },
  statusTap: function (e) {
    const index = e.detail.index;
    const status = this.data.statusType[index].status;
    this.setData({
      page: 1,
      status,
    });
    this.orderList();
  },
  cancelOrderTap: function (e) {
    const that = this;
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: "确定要取消该订单吗？",
      content: "",
      success: function (res) {
        if (res.confirm) {
          WXAPI.orderClose(wx.getStorageSync("token"), orderId).then(function (
            res
          ) {
            if (res.code == 0) {
              that.data.page = 1;
              that.orderList();
              that.getOrderStatistics();
            }
          });
        }
      },
    });
  },
  refundApply(e) {
    // 申请售后
    const orderId = e.currentTarget.dataset.id;
    const amount = e.currentTarget.dataset.amount;
    wx.navigateTo({
      url: "/pages/order/refundApply?id=" + orderId + "&amount=" + amount,
    });
  },
  onLoad(options) {
    if (options && options.type) {
      if (options.type == 99) {
        this.setData({
          hasRefund: true,
        });
      } else {
        const tabIndex = this.data.statusType.findIndex((ele) => {
          return ele.status == options.type;
        });
        this.setData({
          status: options.type,
          tabIndex,
        });
      }
    }
  },
  onReady() {
    // 生命周期函数--监听页面初次渲染完成
  },
  getOrderStatistics() {
    WXAPI.orderStatistics(wx.getStorageSync("token")).then((res) => {
      if (res.code == 0) {
        const badges = this.data.badges;
        badges[1] = res.data.count_id_no_pay;
        badges[2] = res.data.count_id_no_transfer;
        badges[3] = res.data.count_id_no_confirm;
        badges[4] = res.data.count_id_no_reputation;
        this.setData({
          badges,
        });
      }
    });
  },
  onShow() {
    this.getOrderStatistics();
    this.orderList();
    this.setData({
      sphpay_open: wx.getStorageSync("sphpay_open"),
    });
  },
  onPullDownRefresh: function () {
    this.data.page = 1;
    this.getOrderStatistics();
    this.orderList();
    wx.stopPullDownRefresh();
  },
  onReachBottom() {
    this.setData({
      page: this.data.page + 1,
    });
    this.orderList();
  },
  async orderList() {
    wx.showLoading({
      title: "",
    });
    var postData = {
      page: this.data.page,
      pageSize: 20,
      token: wx.getStorageSync("token"),
    };
    if (this.data.hasRefund) {
      postData.hasRefund = true;
    }
    if (!postData.hasRefund) {
      postData.status = this.data.status;
    }
    if (postData.status == 9999) {
      postData.status = "";
    }
    const res = await WXAPI.orderList(postData);
    wx.hideLoading();
    if (res.code == 0) {
      if (this.data.page == 1) {
        this.setData({
          orderList: res.data.orderList,
          logisticsMap: res.data.logisticsMap,
          goodsMap: res.data.goodsMap,
        });
      } else {
        this.setData({
          orderList: this.data.orderList.concat(res.data.orderList),
          logisticsMap: Object.assign(
            this.data.logisticsMap,
            res.data.logisticsMap
          ),
          goodsMap: Object.assign(this.data.goodsMap, res.data.goodsMap),
        });
      }
    } else {
      if (this.data.page == 1) {
        this.setData({
          orderList: null,
          logisticsMap: {},
          goodsMap: {},
        });
      } else {
        wx.showToast({
          title: "没有更多了",
          icon: "none",
        });
      }
    }
  },
});
