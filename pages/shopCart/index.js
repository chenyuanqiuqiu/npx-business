const WXAPI = require("apifm-wxapi");
const TOOLS = require("../../utils/tools.js");
const AUTH = require("../../utils/auth.js");
const auth = require("../../utils/auth.js");

const app = getApp();

Page({
  data: {
    shippingCarInfo: [],
    shopList: [],
    shopCarType: 0, //0自营 1云货架
    saveHidden: true,
    allSelect: true,
    changeAll: false,
  },

  onLoad: function () {},
  onShow() {
    AUTH.checkHasLogined().then((isLogined) => {
      if (isLogined) {
        this.shippingCarInfo();
      } else {
        wx.navigateTo({
          url: "pages/login/login",
        });
      }
    });
  },
  onPullDownRefresh: function () {
    this.shippingCarInfo();
    wx.stopPullDownRefresh();
  },
  async radioAll(e) {
    console.log(e);
    let checked = !this.data.changeAll;

    let data = this.data.shippingCarInfo;
    if (data.shopList.length > 0) {
      data.shopList.forEach((item) => {
        item.checked = checked;
        item.childs.forEach((ele) => {
          ele.selected = checked;
        });
      });
    }

    const token = wx.getStorageSync("token");
    let key = data.items
      .map((i) => {
        return i.key;
      })
      .join(",");
    console.log(key, "===");
    await WXAPI.shippingCartSelected(token, key, checked);
    this.shippingCarInfo();
    this.setData({
      changeAll: checked,
      shippingCarInfo: data,
    });
  },
  onClose(event) {
    const { position, instance } = event.detail;
    switch (position) {
      case "cell":
        instance.close();
        break;
      case "right":
        instance.close();
        const key = event.currentTarget.dataset.key;
        this.delItemDone(key);
        break;
    }
  },
  toShopDetail(e) {
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: "/pages/shopDetail/index?id=" + id,
    });
  },
  async shippingCarInfo() {
    const token = wx.getStorageSync("token");
    if (!token) {
      return;
    }
    var res = await WXAPI.shippingCarInfo(token);
    if (res.code == 0) {
      if (this.data.shopCarType == 0) {
        //自营商品
        res.data.items.forEach((ele) => {
          if (!ele.stores || ele.status == 1) {
            ele.selected = false;
          }
        });
        res.data.shopList.forEach((p) => {
          p.childs = res.data.items.filter((ele) => {
            return p.id == ele.shopId;
          });
        });
        for (let obj of res.data.shopList) {
          obj.checked = true;
          for (let child of obj.childs) {
            if (!child.selected) {
              obj.checked = false;
              break;
            }
          }
        }
      }
      this.setData({
        shippingCarInfo: res.data,
      });
    } else {
      this.setData({
        shippingCarInfo: null,
      });
    }
  },
  async radioClickAll(e) {
    let index = e.currentTarget.dataset.index;
    let checked = e.currentTarget.dataset.checked;
    let childs = e.currentTarget.dataset.childs;
    let shippingCarInfo = this.data.shippingCarInfo;
    shippingCarInfo.shopList[index].checked = !checked;
    shippingCarInfo.shopList[index].childs.forEach((ele) => {
      ele.selected = !checked;
    });
    const token = wx.getStorageSync("token");
    let key = childs
      .map((i) => {
        return i.key;
      })
      .join(",");
    console.log(key, "===");

    this.setData({
      shippingCarInfo,
    });
    await WXAPI.shippingCartSelected(token, key, !checked);
    this.shippingCarInfo();
  },
  toIndexPage: function () {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },
  async delItemDone(key) {
    let res = "";
    const token = wx.getStorageSync("token");
    if (this.data.shopCarType == 0) {
      res = await WXAPI.shippingCarInfoRemoveItem(token, key);
    }
    if (this.data.shopCarType == 1) {
      res = await WXAPI.jdvopCartRemove(token, key);
    }
    if (res.code != 0 && res.code != 700) {
      wx.showToast({
        title: res.msg,
        icon: "none",
      });
    } else {
      this.shippingCarInfo();
      TOOLS.showTabBarBadge();
    }
  },
  async jiaBtnTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.shippingCarInfo.items[index];
    const number = item.number + 1;
    const token = wx.getStorageSync("token");
    if (this.data.shopCarType == 0) {
      var res = await WXAPI.shippingCarInfoModifyNumber(
        token,
        item.key,
        number
      );
    } else if (this.data.shopCarType == 1) {
      var res = await WXAPI.jdvopCartModifyNumber(token, item.key, number);
    }
    this.shippingCarInfo();
  },
  async jianBtnTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.shippingCarInfo.items[index];
    const number = item.number - 1;
    if (number <= 0) {
      // 弹出删除确认
      wx.showModal({
        content: "确定要删除该商品吗？",
        success: (res) => {
          if (res.confirm) {
            this.delItemDone(item.key);
          }
        },
      });
      return;
    }
    const token = wx.getStorageSync("token");
    let res = "";
    if (this.data.shopCarType == 0) {
      res = await WXAPI.shippingCarInfoModifyNumber(token, item.key, number);
    }
    if (this.data.shopCarType == 1) {
      res = await WXAPI.jdvopCartModifyNumber(token, item.key, number);
    }
    if (res.code == 0) {
    }
    this.shippingCarInfo();
  },
  changeCarNumber(e) {
    const key = e.currentTarget.dataset.key;
    const num = e.detail.value;
    const token = wx.getStorageSync("token");
    if (this.data.shopCarType == 0) {
      WXAPI.shippingCarInfoModifyNumber(token, key, num).then((res) => {
        this.shippingCarInfo();
      });
    } else if (this.data.shopCarType == 1) {
      WXAPI.jdvopCartModifyNumber(token, key, num).then((res) => {
        this.shippingCarInfo();
      });
    }
  },
  async radioClick(e) {
    let item = e.currentTarget.dataset.item;
    const token = wx.getStorageSync("token");
    if (this.data.shopCarType == 0) {
      //自营购物车
      if (!item.stores || item.status == 1) {
        return;
      }
      await WXAPI.shippingCartSelected(token, item.key, !item.selected);
    } else if (this.data.shopCarType == 1) {
      //云货架购物车
      await WXAPI.jdvopCartSelect(token, item.key, !item.selected);
    }
    this.shippingCarInfo();
  },
  onChange(event) {
    this.setData({
      shopCarType: event.detail.name,
    });
    this.shippingCarInfo();
  },
  goDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: "/pages/goodsDetails/index?id=" + item.goodsId,
    });
  },
});
