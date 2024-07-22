const WXAPI = require("apifm-wxapi");

Date.prototype.format = function (format) {
  var date = {
    "M+": this.getMonth() + 1,
    "d+": this.getDate(),
    "h+": this.getHours(),
    "m+": this.getMinutes(),
    "s+": this.getSeconds(),
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S+": this.getMilliseconds(),
  };
  if (/(y+)/i.test(format)) {
    format = format.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in date) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(
        RegExp.$1,
        RegExp.$1.length == 1
          ? date[k]
          : ("00" + date[k]).substr(("" + date[k]).length)
      );
    }
  }
  return format;
};

Page({
  data: {
    active: "kd",
    radioChecked: "",
    shops: [],
    showPopup: false,
    addressLength: 0,
    addressList: null,
    totalScoreToPay: 0,
    goodsList: [],
    isNeedLogistics: 0, // 是否需要物流信息
    yunPrice: 0,
    allGoodsAndYunPrice: 0,
    goodsJsonStr: "",
    orderType: "", //订单类型，购物车下单或立即支付下单，默认是购物车， buyNow 说明是立即购买
    pingtuanOpenId: undefined, //拼团的话记录团号

    hasNoCoupons: true,
    coupons: [],
    couponAmount: 0, //优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
    curCouponShowText: "请选择使用优惠券", // 当前选择使用的优惠券
    peisongType: "kd", // 配送方式 kd,zq 分别表示快递/到店自取
    remark: "",
    shopIndex: -1,
    pageIsEnd: false,

    bindMobileStatus: 0, // 0 未判断 1 已绑定手机号码 2 未绑定手机号码
    userScore: 0, // 用户可用积分
    deductionScore: "-1", // 本次交易抵扣的积分数， -1 为不抵扣，0 为自动抵扣，其他金额为抵扣多少积分
    shopCarType: 0, //0自营购物车，1云货架购物车
    dyopen: 0, // 是否开启订阅
    dyunit: 0, // 按天
    dyduration: 1, // 订阅间隔
    dytimes: 1, // 订阅次数
    dateStart: undefined, // 订阅首次扣费时间
    minDate: new Date().getTime(),
    maxDate: new Date(2030, 10, 1).getTime(),
    currentDate: new Date().getTime(),
    formatter: (type, value) => {
      if (type === "year") {
        return `${value}年`;
      }
      if (type === "month") {
        return `${value}月`;
      }
      if (type === "day") {
        return `${value}日`;
      }
      if (type === "hour") {
        return `${value}点`;
      }
      if (type === "minute") {
        return `${value}分`;
      }
      return value;
    },
    cardId: "0", // 使用的次卡ID
  },
  onShow() {
    if (this.data.pageIsEnd) {
      return;
    }
    this.getAddress();
    this.doneShow();
  },
  onClose() {
    this.setData({
      showPopup: false,
    });
  },
  onAreaConfirm(event) {},
  navbackto() {
    wx.navigateBack({
      delta: 1,
    });
  },
  async doneShow() {
    let goodsList = [];
    let shopList = [];
    const token = wx.getStorageSync("token");
    //立即购买下单
    if ("buyNow" == this.data.orderType) {
      var buyNowInfoMem = wx.getStorageSync("buyNowInfo");
      this.data.kjId = buyNowInfoMem.kjId;
      if (buyNowInfoMem && buyNowInfoMem.shopList) {
        goodsList = buyNowInfoMem.shopList;
      }
    } else {
      //购物车下单
      let res = await WXAPI.shippingCarInfo(token);
      shopList = res.data.shopList;
      if (res.code == 0) {
        goodsList = res.data.items.filter((ele) => {
          return ele.selected;
        });
        const shopIds = [];
        goodsList.forEach((ele) => {
          if (this.data.shopCarType == 1) {
            ele.shopId = 0;
          }
          shopIds.push(ele.shopId);
        });
        shopList = shopList.filter((ele) => {
          return shopIds.includes(ele.id);
        });
      }
    }
    shopList.forEach((ele) => {
      ele.hasNoCoupons = true;
    });
    this.setData({
      shopList,
      goodsList,
      peisongType: this.data.peisongType,
    });
    this.userAmount();
  },

  onLoad(e) {
    const nowDate = new Date();
    let _data = {
      isNeedLogistics: 1,
      dateStart: nowDate.format("yyyy-MM-dd h:m:s"),
      orderPeriod_open: wx.getStorageSync("orderPeriod_open"),
      order_pay_user_balance: wx.getStorageSync("order_pay_user_balance"),
      zt_open_hx: wx.getStorageSync("zt_open_hx"),
    };
    if (e.orderType) {
      _data.orderType = e.orderType;
    }
    if (e.pingtuanOpenId) {
      _data.pingtuanOpenId = e.pingtuanOpenId;
    }
    if (e.shopCarType) {
      _data.shopCarType = e.shopCarType;
    }
    this.setData(_data);
    this.getUserApiInfo();
    this.cardMyList();
    this.initShippingAddress();
  },
  async userAmount() {
    const res = await WXAPI.userAmount(wx.getStorageSync("token"));
    const order_pay_user_balance = wx.getStorageSync("order_pay_user_balance");
    if (res.code == 0) {
      this.setData({
        balance: order_pay_user_balance == "1" ? res.data.balance : 0,
        userScore: res.data.score,
      });
    }
  },
  remarkChange(e) {
    this.data.remark = e.detail.value;
  },
  async goCreateOrder() {
    this.setData({
      btnLoading: true,
    });
    // 检测实名认证状态
    if (wx.getStorageSync("needIdCheck") == 1) {
      const res = await WXAPI.userDetail(wx.getStorageSync("token"));
      if (res.code == 0 && !res.data.base.isIdcardCheck) {
        wx.navigateTo({
          url: "/pages/idCheck/index",
        });
        this.setData({
          btnLoading: false,
        });
        return;
      }
    }
    const subscribe_ids = wx.getStorageSync("subscribe_ids");
    if (subscribe_ids) {
      wx.requestSubscribeMessage({
        tmplIds: subscribe_ids.split(","),
        success(res) {
          console.log(res);
        },
        fail(e) {
          console.error(e);
        },
        complete: (e) => {
          this.createOrder(true);
        },
      });
    } else {
      this.createOrder(true);
    }
  },
  async createOrder(e) {},
  async initShippingAddress() {
    const res = await WXAPI.defaultAddress(wx.getStorageSync("token"));
    if (res.code == 0) {
      let id = res.data.info.id;
      let data = res.data.info;
      res.data.info.name = data.provinceStr + data.cityStr + data.areaStr;
      this.setData({
        curAddressData: res.data.info,
        radioChecked: id,
      });
    } else {
      this.setData({
        curAddressData: null,
      });
    }
    this.processYunfei();
  },
  processYunfei() {
    let goodsList = this.data.goodsList;
    if (goodsList.length == 0) {
      return;
    }
    const goodsJsonStr = [];
    let isNeedLogistics = 0;

    let inviter_id = 0;
    let inviter_id_storge = wx.getStorageSync("referrer");
    if (inviter_id_storge) {
      inviter_id = inviter_id_storge;
    }
    for (let i = 0; i < goodsList.length; i++) {
      let carShopBean = goodsList[i];
      if (carShopBean.logistics || carShopBean.logisticsId) {
        isNeedLogistics = 1;
      }

      const _goodsJsonStr = {
        propertyChildIds: carShopBean.propertyChildIds,
      };
      if (carShopBean.sku && carShopBean.sku.length > 0) {
        let propertyChildIds = "";
        carShopBean.sku.forEach((option) => {
          propertyChildIds =
            propertyChildIds +
            "," +
            option.optionId +
            ":" +
            option.optionValueId;
        });
        _goodsJsonStr.propertyChildIds = propertyChildIds;
      }
      if (carShopBean.additions && carShopBean.additions.length > 0) {
        let goodsAdditionList = [];
        carShopBean.additions.forEach((option) => {
          goodsAdditionList.push({
            pid: option.pid,
            id: option.id,
          });
        });
        _goodsJsonStr.goodsAdditionList = goodsAdditionList;
      }
      _goodsJsonStr.goodsId = carShopBean.goodsId;
      _goodsJsonStr.number = carShopBean.number;
      _goodsJsonStr.logisticsType = 0;
      _goodsJsonStr.inviter_id = inviter_id;
      goodsJsonStr.push(_goodsJsonStr);
    }
    this.setData({
      isNeedLogistics: isNeedLogistics,
      goodsJsonStr: JSON.stringify(goodsJsonStr),
    });
    this.createOrder();
  },
  addAddress() {
    wx.navigateTo({
      url: "/pages/addressAdd/index",
    });
  },
  onChange(event) {
    let id = event.detail;
    let arr = this.data.addressList.filter((item) => {
      return item.id == id;
    });
    this.setData({
      radioChecked: id,
      curAddressData: arr[0],
    });
    console.log(arr, "arr");
  },
  async getAddress() {
    const res = await WXAPI.queryAddress(wx.getStorageSync("token"));
    if (res.code == 0) {
      this.setData({
        addressList: res.data,
        addressLength: res.data ? res.data.length : 0,
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null,
        addressLength: 0,
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
    }
  },
  selectAddress() {
    wx.navigateTo({
      url: "/pages/selectAddress/index?type=confirmOrder",
    });
  },
  bindChangeCoupon(e) {
    const selIndex = e.detail.value;
    this.setData({
      curCoupon: this.data.coupons[selIndex],
      curCouponShowText: this.data.coupons[selIndex].nameExt,
    });
    this.processYunfei();
  },
  bindChangeCouponShop(e) {
    const selIndex = e.detail.value;
    const shopIndex = e.currentTarget.dataset.sidx;
    const shopList = this.data.shopList;
    const curshop = shopList[shopIndex];
    curshop.curCoupon = curshop.coupons[selIndex];
    curshop.curCouponShowText = curshop.coupons[selIndex].nameExt;
    shopList.splice(shopIndex, 1, curshop);
    this.setData({
      shopList,
    });
    this.processYunfei();
  },
  radioChange(e) {
    this.setData({
      peisongType: e.detail.name,
    });
    this.processYunfei();
    if (e.detail.name == "zq") {
      this.fetchShops();
    }
  },
  dyChange(e) {
    this.setData({
      dyopen: e.detail.value,
    });
  },
  dyunitChange(e) {
    this.setData({
      dyunit: e.detail.value,
    });
  },
  async fetchShops() {
    const res = await WXAPI.fetchShops();
    if (res.code == 0) {
      let shopIndex = this.data.shopIndex;
      const shopInfo = wx.getStorageSync("shopInfo");
      if (shopInfo) {
        shopIndex = res.data.findIndex((ele) => {
          return ele.id == shopInfo.id;
        });
      }
      this.setData({
        shops: res.data,
        shopIndex,
      });
    }
  },
  shopSelect(e) {
    this.setData({
      shopIndex: e.detail.value,
    });
  },
  openAddress() {
    this.setData({
      showPopup: true,
    });
  },
  goMap() {
    let data = this.data.curAddressData;
    let that = this;
    // wx.openLocation({
    //   latitude,
    //   longitude,
    //   scale: 18,
    // });
    wx.getLocation({
      type: "gcj02",
      success: function (res) {
        console.log(res, "地图");
        wx.chooseLocation({
          success: function (e) {
            if (e.errMsg == "chooseLocation:ok") {
              data.address = e.name;
              data.name = e.address;
            }
            that.setData({ curAddressData: data });
          },
          fail: function (err) {
            console.log(err);
          },
        });
      },
    });
  },
  callMobile() {
    const shop = this.data.shops[this.data.shopIndex];
    wx.makePhoneCall({
      phoneNumber: shop.linkPhone,
    });
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync("token"));
    if (res.code == 0) {
      this.setData({
        bindMobileStatus: res.data.base.mobile ? 1 : 2, // 账户绑定的手机号码状态
        mobile: res.data.base.mobile,
        name: res.data.base.nick,
      });
    }
  },
  async getPhoneNumber(e) {
    if (!e.detail.errMsg || e.detail.errMsg != "getPhoneNumber:ok") {
      wx.showToast({
        title: e.detail.errMsg,
        icon: "none",
      });
      return;
    }
    let res;
    const extConfigSync = wx.getExtConfigSync();
    if (extConfigSync.subDomain) {
      // 服务商模式
      res = await WXAPI.wxappServiceBindMobile({
        token: wx.getStorageSync("token"),
        code: this.data.code,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
      });
    } else {
      res = await WXAPI.bindMobileWxappV2(
        wx.getStorageSync("token"),
        e.detail.code
      );
    }
    if (res.code == 0) {
      wx.showToast({
        title: "读取成功",
        icon: "success",
      });
      this.setData({
        mobile: res.data,
        bindMobileStatus: 1,
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
    }
  },
  deductionScoreChange(event) {
    this.setData({
      deductionScore: event.detail,
    });
    this.processYunfei();
  },
  deductionScoreClick(event) {
    const { name } = event.currentTarget.dataset;
    this.setData({
      deductionScore: name,
    });
    this.processYunfei();
  },
  cardChange(event) {
    this.setData({
      cardId: event.detail,
    });
    this.processYunfei();
  },
  cardClick(event) {
    const { name } = event.currentTarget.dataset;
    this.setData({
      cardId: name,
    });
    this.processYunfei();
  },
  dateStartclick(e) {
    this.setData({
      dateStartpop: true,
    });
  },
  dateStartconfirm(e) {
    const d = new Date(e.detail);
    this.setData({
      dateStart: d.format("yyyy-MM-dd h:m:s"),
      dateStartpop: false,
    });
    console.log(e);
  },
  dateStartcancel(e) {
    this.setData({
      dateStartpop: false,
    });
  },
  async cardMyList() {
    const res = await WXAPI.cardMyList(wx.getStorageSync("token"));
    if (res.code == 0) {
      const myCards = res.data.filter((ele) => {
        return ele.status == 0 && ele.amount > 0 && ele.cardInfo.refs;
      });
      if (myCards.length > 0) {
        this.setData({
          myCards: res.data,
        });
      }
    }
  },
});
