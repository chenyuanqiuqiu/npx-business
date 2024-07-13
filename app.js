// app.js 入口文件
const WXAPI = require("apifm-wxapi");
const CONFIG = require("config.js");
const AUTH = require("utils/auth");

App({
  globalData: {
    isConnected: true,
    sdkAppID: "",
    mapObject: {},
    apiUserInfoMap: undefined, // 当前登陆用户信息: base/ext/idcard/saleDistributionTeam
  },

  onLaunch() {
    const subDomain = wx.getExtConfigSync().subDomain;
    if (subDomain) {
      WXAPI.init(subDomain);
    } else {
      WXAPI.init(CONFIG.subDomain);
      WXAPI.setMerchantId(CONFIG.merchantId);
    }

    //检查更新
    const that = this;
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: "更新提示",
        content: "新版本已经准备好，是否重启应用？",
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate();
          }
        },
      });
    });

    /**
     * 初次加载判断网络情况
     * 无网络状态下根据实际情况进行调整
     */
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType;
        if (networkType === "none" || networkType === "unknown") {
          that.globalData.isConnected = false;
          wx.showToast({
            title: "当前网络异常！",
            icon: "loading",
            duration: 2000,
          });
        }
      },
    });
    WXAPI.queryConfigBatch(
      "mallName,WITHDRAW_MIN,ALLOW_SELF_COLLECTION,order_hx_uids,subscribe_ids,share_profile,adminUserIds,goodsDetailSkuShowType,shopMod,needIdCheck,balance_pay_pwd,shipping_address_gps,shipping_address_region_level,shopping_cart_vop_open,cps_open,recycle_open,categoryMod,hide_reputation,show_seller_number,show_goods_echarts,show_buy_dynamic,goods_search_show_type,show_3_seller,show_quan_exchange_score,show_score_exchange_growth,show_score_sign,fx_subscribe_ids,share_pic,orderPeriod_open,order_pay_user_balance,wxpay_api_url,sphpay_open,fx_type,invoice_subscribe_ids,zt_open_hx,withdrawal,customerServiceChatCorpId,customerServiceChatUrl"
    ).then((res) => {
      if (res.code == 0) {
        res.data.forEach((config) => {
          wx.setStorageSync(config.key, config.value);
        });
        if (this.configLoadOK) {
          this.configLoadOK();
        }
        // wx.setStorageSync('shopMod', '1') // 测试用，不要取消注释
      }
    });
    /**
     * 监听网络状态变化
     * 可根据业务需求进行调整
     */
    wx.onNetworkStatusChange(function (res) {
      if (!res.isConnected) {
        that.globalData.isConnected = false;
        wx.showToast({
          title: "网络已断开",
          icon: "loading",
          duration: 2000,
        });
      } else {
        that.globalData.isConnected = true;
        wx.hideToast();
      }
    });

    //---------------检测navbar高度
    let menuButtonObject = wx.getMenuButtonBoundingClientRect();
    console.log("小程序胶囊信息", menuButtonObject);
    wx.getSystemInfo({
      success: (res) => {
        let statusBarHeight = res.statusBarHeight, //状态栏高度
          navTop = menuButtonObject.top, //胶囊按钮与顶部的距离
          navHeight =
            statusBarHeight +
            menuButtonObject.height +
            (menuButtonObject.top - statusBarHeight) * 2; //导航高度
        this.globalData.navHeight = navHeight;
        this.globalData.navTop = navTop;
        this.globalData.windowHeight = res.windowHeight;
        this.globalData.menuButtonObject = menuButtonObject;
        console.log("navHeight", navHeight);
      },
      fail(err) {
        console.log(err);
      },
    });
  },
  onShow(e) {
    // 自动登录
    AUTH.checkHasLogined().then((isLogined) => {
      if (!isLogined) {
        AUTH.authorize().then((aaa) => {
          if (CONFIG.bindSeller) {
            AUTH.bindSeller();
          }
          this.getUserApiInfo();
        });
      } else {
        if (CONFIG.bindSeller) {
          AUTH.bindSeller();
        }
        this.getUserApiInfo();
      }
    });
  },
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync("token"));
    if (res.code == 0) {
      this.globalData.apiUserInfoMap = res.data;
    }
  },
  initNickAvatarUrlPOP(_this) {
    setTimeout(() => {
      if (
        this.globalData.apiUserInfoMap &&
        (!this.globalData.apiUserInfoMap.base.nick ||
          !this.globalData.apiUserInfoMap.base.avatarUrl)
      ) {
        _this.setData({
          nickPopShow: true,
          popnick: this.globalData.apiUserInfoMap.base.nick
            ? this.globalData.apiUserInfoMap.base.nick
            : "",
          popavatarUrl: this.globalData.apiUserInfoMap.base.avatarUrl
            ? this.globalData.apiUserInfoMap.base.avatarUrl
            : "",
        });
      }
    }, 3000); // 3秒后弹出
  },
});
