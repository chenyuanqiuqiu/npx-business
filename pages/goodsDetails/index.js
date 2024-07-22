const WXAPI = require("apifm-wxapi");
const TOOLS = require("../../utils/tools.js");
const AUTH = require("../../utils/auth");
const CONFIG = require("../../config.js");
import Poster from "wxa-plugin-canvas/poster/poster";
const APP = getApp();

Page({
  data: {
    tabs: [
      {
        tabs_name: "简介",
        view_id: "swiper-container",
        topHeight: 0,
      },
      {
        tabs_name: "详情",
        view_id: "goods-des-info",
        topHeight: 0,
      },
      {
        tabs_name: "评价",
        view_id: "reputation",
        topHeight: 0,
      },
    ],
    isSticky: true,
    createTabs: false, //绘制tabs
    goodsDetail: {},
    hasMoreSelect: false,
    selectSizePrice: 0,
    selectSizeOPrice: 0,
    totalScoreToPay: 0,
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    propertyChildIds: "",
    propertyChildNames: "",
    canSubmit: false, //  选中规格尺寸时候是否允许加入购物车
    shopType: "addShopCar", //购物类型，加入购物车或立即购买，默认为加入购物车
  },
  bindscroll(e) {
    if (this.data.tabclicked) {
      return;
    }
    //计算页面 轮播图、详情、评价(砍价)view 高度
    this.getTopHeightFunction();
    var tabsHeight = this.data.tabsHeight; //顶部距离（tabs高度）
    if (
      this.data.tabs[0].topHeight - tabsHeight <= 0 &&
      0 < this.data.tabs[1].topHeight - tabsHeight
    ) {
      //临界值，根据自己的需求来调整
      this.setData({
        active: this.data.tabs[0].tabs_name, //设置当前标签栏
      });
    } else if (this.data.tabs.length == 2) {
      this.setData({
        active: this.data.tabs[1].tabs_name,
      });
    } else if (
      this.data.tabs[1].topHeight - tabsHeight <= 0 &&
      0 < this.data.tabs[2].topHeight - tabsHeight
    ) {
      this.setData({
        active: this.data.tabs[1].tabs_name,
      });
    } else if (this.data.tabs[2].topHeight - tabsHeight <= 0) {
      this.setData({
        active: this.data.tabs[2].tabs_name,
      });
    }
  },
  onLoad(e) {
    // e.id = 122843
    // 读取分享链接中的邀请人编号
    if (e && e.inviter_id) {
      wx.setStorageSync("referrer", e.inviter_id);
    }
    // 读取小程序码中的邀请人编号
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene); // 处理扫码进商品详情页面的逻辑
      if (scene && scene.split(",").length >= 2) {
        e.id = scene.split(",")[0];
        wx.setStorageSync("referrer", scene.split(",")[1]);
      }
    }
    // 静默式授权注册/登陆
    AUTH.checkHasLogined().then((isLogined) => {
      if (!isLogined) {
        AUTH.authorize().then((aaa) => {
          if (CONFIG.bindSeller) {
            AUTH.bindSeller();
          }
        });
      } else {
        if (CONFIG.bindSeller) {
          AUTH.bindSeller();
        }
      }
    });
    this.data.goodsId = e.id;
    let goodsDetailSkuShowType = wx.getStorageSync("goodsDetailSkuShowType");
    if (!goodsDetailSkuShowType) {
      goodsDetailSkuShowType = 0;
    }
    this.setData({
      goodsDetailSkuShowType,
      curuid: wx.getStorageSync("uid"),
      customerServiceType: CONFIG.customerServiceType,
    });
    this.shippingCartInfo();
    this.goodsAddition();
    this.getGoodsDetail(this.data.goodsId);
  },
  onPullDownRefresh: function () {
    this.shippingCartInfo();
    this.goodsAddition();
    this.getGoodsDetail(this.data.goodsId);
    wx.stopPullDownRefresh();
  },
  onPageScroll(e) {
    console.log(e, "-----滚动-------");
    this.setData({
      scrollTop: e.scrollTop,
    });
    // if (this.data.scrollTop >= 90) {
    //   this.setData({
    //     isSticky: true,
    //   });
    // } else {
    //   this.setData({
    //     isSticky: false,
    //   });
    // }
  },
  async getGoodsDetail(goodsId) {
    const token = wx.getStorageSync("token");
    const that = this;
    const goodsDetailRes = await WXAPI.goodsDetail(goodsId, token ? token : "");
    if (goodsDetailRes.code == 0) {
      if (!goodsDetailRes.data.pics || goodsDetailRes.data.pics.length == 0) {
        goodsDetailRes.data.pics = [
          {
            pic: goodsDetailRes.data.basicInfo.pic,
          },
        ];
      }
      if (goodsDetailRes.data.properties) {
        that.setData({
          hasMoreSelect: true,
          selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
          selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
          totalScoreToPay: goodsDetailRes.data.basicInfo.minScore,
        });
      }
      if (goodsDetailRes.data.basicInfo.shopId) {
        this.shopSubdetail(goodsDetailRes.data.basicInfo.shopId);
      }
      if (goodsDetailRes.data.basicInfo.pingtuan) {
        that.pingtuanList(goodsId);
      }
      that.data.goodsDetail = goodsDetailRes.data;
      if (goodsDetailRes.data.basicInfo.videoId) {
        that.getVideoSrc(goodsDetailRes.data.basicInfo.videoId);
      }
      let _data = {
        goodsDetail: goodsDetailRes.data,
        selectSizePrice: goodsDetailRes.data.basicInfo.minPrice,
        selectSizeOPrice: goodsDetailRes.data.basicInfo.originalPrice,
        totalScoreToPay: goodsDetailRes.data.basicInfo.minScore,
        buyNumMax: goodsDetailRes.data.basicInfo.stores,
        buyNumber: goodsDetailRes.data.basicInfo.stores > 0 ? 1 : 0,
      };
      if (goodsDetailRes.data.basicInfo.pingtuan) {
        const pingtuanSetRes = await WXAPI.pingtuanSet(goodsId);
        if (pingtuanSetRes.code == 0) {
          _data.pingtuanSet = pingtuanSetRes.data;
          // 如果是拼团商品， 默认显示拼团价格
          _data.selectSizePrice = goodsDetailRes.data.basicInfo.pingtuanPrice;
        }
      }
      that.setData(_data);
    }
  },
  async goodsAddition() {
    const res = await WXAPI.goodsAddition(this.data.goodsId);
    if (res.code == 0) {
      this.setData({
        goodsAddition: res.data,
        hasMoreSelect: true,
      });
    }
  },
  async shippingCartInfo() {
    const number = await TOOLS.showTabBarBadge(true);
    this.setData({
      shopNum: number,
    });
  },
  onShow() {
    this.setData({
      createTabs: true, //绘制tabs
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject, //小程序胶囊信息
    });
    //计算tabs高度
    if (this.data.isSticky) {
      var query = wx.createSelectorQuery();
      query
        .select("#tabs")
        .boundingClientRect((rect) => {
          var tabsHeight = rect.height;
          this.setData({
            tabsHeight: tabsHeight,
          });
        })
        .exec();
    }
    AUTH.checkHasLogined().then((isLogined) => {
      if (isLogined) {
        this.goodsFavCheck();
      }
    });
  },
  getTopHeightFunction() {
    var that = this;
    var tabs = that.data.tabs;
    tabs.forEach((element, index) => {
      var viewId = "#" + element.view_id;
      that.getTopHeight(viewId, index);
    });
  },
  getTopHeight(viewId, index) {
    var query = wx.createSelectorQuery();
    query
      .select(viewId)
      .boundingClientRect((rect) => {
        if (!rect) {
          return;
        }
        let top = rect.top;
        var tabs = this.data.tabs;
        tabs[index].topHeight = top;
        this.setData({
          tabs: tabs,
        });
      })
      .exec();
  },
  async goodsFavCheck() {
    const res = await WXAPI.goodsFavCheck(
      wx.getStorageSync("token"),
      this.data.goodsId
    );
    if (res.code == 0) {
      this.setData({
        faved: true,
      });
    } else {
      this.setData({
        faved: false,
      });
    }
  },
  async addFav() {
    AUTH.checkHasLogined().then((isLogined) => {
      if (isLogined) {
        if (this.data.faved) {
          // 取消收藏
          WXAPI.goodsFavDelete(
            wx.getStorageSync("token"),
            "",
            this.data.goodsId
          ).then((res) => {
            this.goodsFavCheck();
          });
        } else {
          // 加入收藏
          WXAPI.goodsFavPut(wx.getStorageSync("token"), this.data.goodsId).then(
            (res) => {
              this.goodsFavCheck();
            }
          );
        }
      }
    });
  },
  async shopSubdetail(shopId) {
    const res = await WXAPI.shopSubdetail(shopId);
    if (res.code == 0) {
      this.setData({
        shopSubdetail: res.data,
      });
    }
  },
  goShopCar() {
    wx.reLaunch({
      url: "/pages/shopCart/index",
    });
  },
  toAddShopCar() {
    this.setData({
      shopType: "addShopCar",
    });
    this.bindGuiGeTap();
  },
  tobuy() {
    this.setData({
      shopType: "tobuy",
    });
    this.bindGuiGeTap();
  },
  /**
   * 规格选择弹出框
   */
  bindGuiGeTap: function () {
    this.setData({
      hideShopPopup: false,
      selectSizePrice: this.data.goodsDetail.basicInfo.minPrice,
      selectSizeOPrice: this.data.goodsDetail.basicInfo.originalPrice,
      skuGoodsPic: this.data.goodsDetail.basicInfo.pic,
    });
  },
  navbackto() {
    wx.navigateBack({
      delta: 1,
    });
  },
  switchto() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },
  /**
   * 规格选择弹出框隐藏
   */
  closePopupTap: function () {
    this.setData({
      hideShopPopup: true,
    });
  },
  stepChange(event) {
    this.setData({
      buyNumber: event.detail,
    });
  },
  /**
   * 选择商品规格
   */
  async labelItemTap(e) {
    const propertyindex = e.currentTarget.dataset.propertyindex;
    const propertychildindex = e.currentTarget.dataset.propertychildindex;

    const property = this.data.goodsDetail.properties[propertyindex];
    const child = property.childsCurGoods[propertychildindex];
    const _childActive = child.active;
    // 当前位置往下的所有sku取消选中状态
    for (
      let index = propertyindex;
      index < this.data.goodsDetail.properties.length;
      index++
    ) {
      const element = this.data.goodsDetail.properties[index];
      element.optionValueId = null;
      element.childsCurGoods.forEach((child) => {
        child.active = false;
      });
    }
    // 设置当前选中状态，或者取消选中
    property.optionValueId = child.id;
    child.active = true;

    // 获取所有的选中规格尺寸数据
    const needSelectNum = this.data.goodsDetail.properties.length;
    let curSelectNum = 0;
    let propertyChildIds = "";
    let propertyChildNames = "";
    let _skuList = this.data.goodsDetail.skuList;

    this.data.goodsDetail.properties.forEach((p) => {
      p.childsCurGoods.forEach((c) => {
        // 处理当前选中的sku信息
        if (c.active) {
          _skuList = _skuList.filter((aaa) => {
            return aaa.propertyChildIds.indexOf(p.id + ":" + c.id) != -1;
          });
          curSelectNum++;
          propertyChildIds = propertyChildIds + p.id + ":" + c.id + ",";
          propertyChildNames =
            propertyChildNames + p.name + ":" + c.name + "  ";
        } else if (!p.optionValueId) {
          const nextO = _skuList.find((aaa) => {
            return aaa.propertyChildIds.indexOf(p.id + ":" + c.id) != -1;
          });
          c.hidden = nextO ? false : true;
        }
      });
    });
    let canSubmit = false;
    if (needSelectNum == curSelectNum) {
      canSubmit = true;
    }
    let skuGoodsPic = this.data.skuGoodsPic;
    if (
      this.data.goodsDetail.subPics &&
      this.data.goodsDetail.subPics.length > 0
    ) {
      const _subPic = this.data.goodsDetail.subPics.find((ele) => {
        return ele.optionValueId == child.id;
      });
      if (_subPic) {
        skuGoodsPic = _subPic.pic;
      }
    }
    this.setData({
      goodsDetail: this.data.goodsDetail,
      canSubmit,
      skuGoodsPic,
      propertyChildIds,
      propertyChildNames,
    });
    this.calculateGoodsPrice();
  },
  async calculateGoodsPrice() {
    // 计算最终的商品价格
    let price = this.data.goodsDetail.basicInfo.minPrice;
    let originalPrice = this.data.goodsDetail.basicInfo.originalPrice;
    let totalScoreToPay = this.data.goodsDetail.basicInfo.minScore;
    let buyNumMax = this.data.goodsDetail.basicInfo.stores;
    let buyNumber = this.data.goodsDetail.basicInfo.minBuyNumber;

    // 计算 sku 价格
    if (this.data.canSubmit) {
      const token = wx.getStorageSync("token");
      const res = await WXAPI.goodsPriceV2({
        token: token ? token : "",
        goodsId: this.data.goodsDetail.basicInfo.id,
        propertyChildIds: this.data.propertyChildIds,
      });
      if (res.code == 0) {
        price = res.data.price;
        originalPrice = res.data.originalPrice;
        totalScoreToPay = res.data.score;
        buyNumMax = res.data.stores;
      }
    }
    // 计算配件价格
    if (this.data.goodsAddition) {
      this.data.goodsAddition.forEach((big) => {
        big.items.forEach((small) => {
          if (small.active) {
            price = (price * 100 + small.price * 100) / 100;
          }
        });
      });
    }
    this.setData({
      selectSizePrice: price,
      selectSizeOPrice: originalPrice,
      totalScoreToPay: totalScoreToPay,
      buyNumMax,
      buyNumber: buyNumMax >= buyNumber ? buyNumber : 0,
    });
  },
  /**
   * 选择可选配件
   */
  async labelItemTap2(e) {
    const propertyindex = e.currentTarget.dataset.propertyindex;
    const propertychildindex = e.currentTarget.dataset.propertychildindex;

    const goodsAddition = this.data.goodsAddition;
    const property = goodsAddition[propertyindex];
    const child = property.items[propertychildindex];
    if (child.active) {
      // 该操作为取消选择
      child.active = false;
      this.setData({
        goodsAddition,
      });
      this.calculateGoodsPrice();
      return;
    }
    // 单选配件取消所有子栏目选中状态
    if (property.type == 0) {
      property.items.forEach((child) => {
        child.active = false;
      });
    }
    // 设置当前选中状态
    child.active = true;
    this.setData({
      goodsAddition,
    });
    this.calculateGoodsPrice();
  },
  /**
   * 加入购物车
   */
  async addShopCar() {
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showToast({
          title: "请选择规格",
          icon: "none",
        });
      }
      this.bindGuiGeTap();
      return;
    }
    const goodsAddition = [];
    if (this.data.goodsAddition) {
      let canSubmit = true;
      this.data.goodsAddition.forEach((ele) => {
        if (ele.required) {
          const a = ele.items.find((item) => {
            return item.active;
          });
          if (!a) {
            canSubmit = false;
          }
        }
        ele.items.forEach((item) => {
          if (item.active) {
            goodsAddition.push({
              id: item.id,
              pid: item.pid,
            });
          }
        });
      });
      if (!canSubmit) {
        wx.showToast({
          title: "请选择配件",
          icon: "none",
        });
        this.bindGuiGeTap();
        return;
      }
    }
    if (this.data.buyNumber < 1) {
      wx.showToast({
        title: "请选择购买数量",
        icon: "none",
      });
      return;
    }
    const isLogined = await AUTH.checkHasLogined();
    if (!isLogined) {
      return;
    }
    const token = wx.getStorageSync("token");
    const goodsId = this.data.goodsDetail.basicInfo.id;
    const sku = [];
    if (this.data.goodsDetail.properties) {
      this.data.goodsDetail.properties.forEach((p) => {
        sku.push({
          optionId: p.id,
          optionValueId: p.optionValueId,
        });
      });
    }
    const res = await WXAPI.shippingCarInfoAddItem(
      token,
      goodsId,
      this.data.buyNumber,
      sku,
      goodsAddition
    );
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
      return;
    }

    this.closePopupTap();
    wx.showToast({
      title: "加入购物车",
      icon: "success",
    });
    this.shippingCartInfo();
  },
  /**
   * 立即购买
   */
  buyNow(e) {
    let shoptype = e.currentTarget.dataset.shoptype;
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      wx.showToast({
        title: "请选择规格",
        icon: "none",
      });
      this.bindGuiGeTap();
      return;
    }
    if (this.data.goodsAddition) {
      let canSubmit = true;
      this.data.goodsAddition.forEach((ele) => {
        if (ele.required) {
          const a = ele.items.find((item) => {
            return item.active;
          });
          if (!a) {
            canSubmit = false;
          }
        }
      });
      if (!canSubmit) {
        wx.showToast({
          title: "请选择配件",
          icon: "none",
        });
        this.bindGuiGeTap();
        return;
      }
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: "提示",
        content: "购买数量不能为0！",
        showCancel: false,
      });
      return;
    }
    //组建立即购买信息
    let buyNowInfo = this.buliduBuyNowInfo(shoptype);
    // 写入本地存储
    wx.setStorage({
      key: "buyNowInfo",
      data: buyNowInfo,
    });
    this.closePopupTap();
    wx.navigateTo({
      url: "/subpackageA/pages/toPayOrder/index?orderType=buyNow",
    });
  },
  /**
   * 组建立即购买信息
   */
  buliduBuyNowInfo(shoptype) {
    var shopCarMap = {};
    shopCarMap.goodsId = this.data.goodsDetail.basicInfo.id;
    shopCarMap.shopId = this.data.goodsDetail.basicInfo.shopId;
    shopCarMap.pic = this.data.goodsDetail.basicInfo.pic;
    shopCarMap.name = this.data.goodsDetail.basicInfo.name;
    // shopCarMap.label=this.data.goodsDetail.basicInfo.id; 规格尺寸
    shopCarMap.propertyChildIds = this.data.propertyChildIds;
    shopCarMap.label = this.data.propertyChildNames;
    shopCarMap.price = this.data.selectSizePrice;
    shopCarMap.score = this.data.totalScoreToPay;
    shopCarMap.left = "";
    shopCarMap.active = true;
    shopCarMap.number = this.data.buyNumber;
    shopCarMap.logisticsType = this.data.goodsDetail.basicInfo.logisticsId;
    shopCarMap.logistics = this.data.goodsDetail.logistics;
    shopCarMap.weight = this.data.goodsDetail.basicInfo.weight;

    if (this.data.goodsAddition && this.data.goodsAddition.length > 0) {
      const additions = [];
      this.data.goodsAddition.forEach((ele) => {
        ele.items.forEach((item) => {
          if (item.active) {
            additions.push({
              id: item.id,
              name: item.name,
              pid: ele.id,
              pname: ele.name,
            });
          }
        });
      });
      if (additions.length > 0) {
        shopCarMap.additions = additions;
      }
    }

    var buyNowInfo = {};
    buyNowInfo.shopNum = 0;
    buyNowInfo.shopList = [];

    buyNowInfo.shopList.push(shopCarMap);
    buyNowInfo.kjId = this.data.kjId;
    if (this.data.shopSubdetail) {
      buyNowInfo.shopInfo = this.data.shopSubdetail.info;
    } else {
      buyNowInfo.shopInfo = {
        id: 0,
        name: "其他",
        pic: null,
        serviceDistance: 99999999,
      };
    }

    return buyNowInfo;
  },
  onShareAppMessage() {
    let _data = {
      title: this.data.goodsDetail.basicInfo.name,
      path:
        "/pages/goodsDetails/index?id=" +
        this.data.goodsDetail.basicInfo.id +
        "&inviter_id=" +
        wx.getStorageSync("uid"),
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      },
    };
    return _data;
  },
  onShareTimeline() {
    let title = this.data.goodsDetail.basicInfo.name;
    let query =
      "id=" +
      this.data.goodsDetail.basicInfo.id +
      "&inviter_id=" +
      wx.getStorageSync("uid");
    return {
      title,
      query,
      imageUrl: this.data.goodsDetail.basicInfo.pic,
    };
  },
  getVideoSrc: function (videoId) {
    var that = this;
    WXAPI.videoDetail(videoId).then(function (res) {
      if (res.code == 0) {
        that.setData({
          videoMp4Src: res.data.fdMp4,
        });
      }
    });
  },
  closePop() {
    this.setData({
      showposterImg: false,
    });
  },
  async drawSharePic() {
    const _this = this;
    // https://www.yuque.com/apifm/nu0f75/ak40es
    const accountInfo = wx.getAccountInfoSync();
    const envVersion = accountInfo.miniProgram.envVersion;
    const qrcodeRes = await WXAPI.wxaQrcode({
      scene:
        _this.data.goodsDetail.basicInfo.id + "," + wx.getStorageSync("uid"),
      page: "pages/ggoodsDetails/index",
      is_hyaline: true,
      autoColor: true,
      expireHours: 1,
      env_version: envVersion,
      check_path: envVersion == "release" ? true : false,
    });
    if (qrcodeRes.code != 0) {
      wx.showToast({
        title: qrcodeRes.msg,
        icon: "none",
      });
      return;
    }
    const qrcode = qrcodeRes.data;
    const pic = _this.data.goodsDetail.basicInfo.pic;
    wx.getImageInfo({
      src: pic,
      success(res) {
        const height = (490 * res.height) / res.width;
        _this.drawSharePicDone(height, qrcode);
      },
      fail(e) {
        console.error(e);
      },
    });
  },
  drawSharePicDone(picHeight, qrcode) {
    const _this = this;
    const _baseHeight = 74 + (picHeight + 120);
    this.setData(
      {
        posterConfig: {
          width: 750,
          height: picHeight + 660,
          backgroundColor: "#fff",
          debug: false,
          blocks: [
            {
              x: 76,
              y: 74,
              width: 604,
              height: picHeight + 120,
              borderWidth: 2,
              borderColor: "#c2aa85",
              borderRadius: 8,
            },
          ],
          images: [
            {
              x: 133,
              y: 133,
              url: _this.data.goodsDetail.basicInfo.pic, // 商品图片
              width: 490,
              height: picHeight,
            },
            {
              x: 76,
              y: _baseHeight + 199,
              url: qrcode, // 二维码
              width: 222,
              height: 222,
            },
          ],
          texts: [
            {
              x: 375,
              y: _baseHeight + 80,
              width: 650,
              lineNum: 2,
              text: _this.data.goodsDetail.basicInfo.name,
              textAlign: "center",
              fontSize: 40,
              color: "#333",
            },
            {
              x: 375,
              y: _baseHeight + 180,
              text: "￥" + _this.data.goodsDetail.basicInfo.minPrice,
              textAlign: "center",
              fontSize: 50,
              color: "#e64340",
            },
            {
              x: 352,
              y: _baseHeight + 320,
              text: "长按识别小程序码",
              fontSize: 28,
              color: "#999",
            },
          ],
        },
      },
      () => {
        Poster.create();
      }
    );
  },
  onPosterSuccess(e) {
    console.log("success:", e);
    this.setData({
      posterImg: e.detail,
      showposterImg: true,
    });
  },
  onPosterFail(e) {
    console.error("fail:", e);
  },
  savePosterPic() {
    const _this = this;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImg,
      success: (res) => {
        wx.showModal({
          content: "已保存到手机相册",
          showCancel: false,
          confirmText: "知道了",
          confirmColor: "#333",
        });
      },
      complete: () => {
        _this.setData({
          showposterImg: false,
        });
      },
      fail: (res) => {
        if (
          res.errMsg.indexOf("fail privacy permission is not authorized") != -1
        ) {
          wx.showModal({
            content: "请阅读并同意隐私条款以后才能继续本操作",
            confirmText: "阅读协议",
            cancelText: "取消",
            success(res) {
              if (res.confirm) {
                wx.requirePrivacyAuthorize(); // 弹出用户隐私授权框
              }
            },
          });
        } else if (res.errMsg.indexOf("fail auth deny") != -1) {
          wx.showModal({
            content: "本次操作需要您同意并将图片写入手机相册",
            confirmText: "立即授权",
            cancelText: "取消",
            success(res) {
              if (res.confirm) {
                // 弹出设置窗口，让用户去设置
                wx.openSetting({
                  withSubscriptions: true,
                  fail: (aaa) => console.log(aaa),
                });
              }
            },
          });
        } else if (res.errMsg.indexOf("fail cancel") != -1) {
          wx.showToast({
            title: "已取消",
            icon: "none",
          });
        } else {
          console.error(res);
          wx.showToast({
            title: res.errMsg,
            icon: "none",
          });
        }
      },
    });
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [url], // 需要预览的图片http链接列表
    });
  },
  previewImage2(e) {
    const url = e.currentTarget.dataset.url;
    const urls = [];
    this.data.goodsDetail.pics.forEach((ele) => {
      urls.push(ele.pic);
    });
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls, // 需要预览的图片http链接列表
    });
  },
  onTabsChange(e) {
    var index = e.detail.index;
    this.setData({
      toView: this.data.tabs[index].view_id,
      tabclicked: true,
    });
    setTimeout(() => {
      this.setData({
        tabclicked: false,
      });
    }, 1000);
  },
  backToHome() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },
  customerService() {
    wx.openCustomerServiceChat({
      extInfo: { url: wx.getStorageSync("customerServiceChatUrl") },
      corpId: wx.getStorageSync("customerServiceChatCorpId"),
      showMessageCard: true,
      sendMessageTitle: this.data.goodsDetail.basicInfo.name,
      sendMessagePath:
        "/pages/goodsDetails/index?id=" + this.data.goodsDetail.basicInfo.id,
      sendMessageImg: this.data.goodsDetail.basicInfo.pic,
      success: (res) => {},
      fail: (err) => {
        console.error(err);
      },
    });
  },
});
