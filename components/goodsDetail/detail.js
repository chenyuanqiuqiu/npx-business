const WXAPI = require("apifm-wxapi");
Component({
  options: {
    styleIsolation: "apply-shared",
  },
  /**
   * 页面的初始数据
   */
  data: {
    value1: "",
    show: false,
    value2: "",
    xlColor: false,
    pfColor: false,
    memberColor: false,
    isDiatance: false,
    isMember: false,
    peisongList: [
      {
        name: "waimaipeisong",
        value: "psdq",
        selected: false,
        label: "门店自提",
      },
      {
        name: "waimaipeisong",
        value: "sjzs",
        selected: false,
        label: "配送到家",
      },
    ],
    velocityList: [],
    preferentialList: [
      {
        name: "shoudan",
        value: "shoudan",
        label: "首单立减",
        selected: false,
      },
      {
        name: "jiaobiao_xin",
        value: "xinyonghu",
        label: "新用户立减",
        selected: false,
      },
      {
        name: "jianmian",
        value: "liyanyouhui",
        label: "立减优惠",
        selected: false,
      },
      {
        name: "fanli",
        value: "xiadanfanxian",
        label: "下单返现",
        selected: false,
      },
      {
        name: "zengpin",
        value: "xiadanmanzeng",
        label: "下单满赠",
        selected: false,
      },
      {
        name: "jian",
        value: "manjianpeisong",
        label: "满减配送费",
        selected: false,
      },
      {
        name: "mianze-01",
        value: "mianpeisong",
        label: "免配送费",
        selected: false,
      },
      {
        name: "mianze-01",
        value: "tejiayouhui",
        label: "特价优惠",
        selected: false,
      },
      {
        name: "circle-coupon",
        value: "jindianfanquan",
        label: "进店领券",
        selected: false,
      },
      {
        name: "circle-coupon",
        value: "xiadanfanquan",
        label: "下单返券",
        selected: false,
      },
      {
        name: "ziti",
        value: "zitiyouhui",
        label: "自提优惠",
        selected: false,
      },
      {
        name: "fapiao",
        value: "zhichikaifapiao",
        label: "支持开发票",
        selected: false,
      },
      {
        name: "yuanyouhuiquan",
        value: "huiyuanlinghb",
        label: "会员领红包",
        selected: false,
      },
    ],
    chooseLength: 0,
  },
  // 组件数据字段监听器，用于监听 properties 和 data 的变化
  observers: {
    isMember: function (val) {
      let preferentialList = this.data.preferentialList;
      let index = preferentialList.length - 1;
      if (val) {
        preferentialList[index].selected = true;
        this.setData({
          memberColor: "#000000",
          preferentialList,
        });
      } else {
        preferentialList[index].selected = false;
        this.setData({
          memberColor: "#676565",
          preferentialList,
        });
      }
    },
  },
  lifetimes: {
    attached() {
      console.log("---this.setData初始化完成----");
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      console.log("---清理性工作----");
    },
    create() {
      console.log("---此时不能调用setData----");
    },
  },
  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show() {
      this.shopCategory();
    },
    hide() {},
    resize() {},
  },
  methods: {
    async shopCategory() {
      const res = await WXAPI.shopCategory();
      if (res.code == 0) {
        res.data.forEach((element) => {
          element.selected = false;
        });
        this.setData({
          velocityList: res.data,
        });
      }
      console.log(this.data.velocityList);
    },
    sum() {
      let peisongArr = this.data.peisongList.filter((item) => {
        return item.selected;
      });
      let suduArr = this.data.velocityList.filter((item) => {
        return item.selected;
      });
      let youhuiArr = this.data.preferentialList.filter((item) => {
        return item.selected;
      });
      let chooseLength = peisongArr.length + suduArr.length + youhuiArr.length;
      this.setData({
        chooseLength,
      });
    },
    changeValue() {},
    showPopup() {
      let preferentialList = this.data.preferentialList;
      let index = preferentialList.length - 1;
      if (this.isMember) {
        preferentialList[index].selected = true;
        this.setData({ preferentialList });
      }
      this.setData({ show: true });
    },
    handelHuiyuan(e) {
      let isSelected = e.currentTarget.dataset.isselected;
      let value = e.currentTarget.dataset.value;
      let isMember = "";
      if (value == "huiyuanlinghb" && !isSelected) {
        isMember = true;
      } else {
        isMember = false;
      }
      this.setData({
        isMember,
      });
    },
    handelConfirm() {
      let peisongArr = this.data.peisongList.filter((item) => {
        return item.selected;
      });
      let suduArr = this.data.velocityList.filter((item) => {
        return item.selected;
      });
      let youhuiArr = this.data.preferentialList.filter((item) => {
        return item.selected;
      });
      if (youhuiArr && youhuiArr.length > 0) {
        if (youhuiArr[0].value == "huiyuanlinghb") {
          this.setData({ isMember: true });
        }
      }
      let arr = [...peisongArr, ...suduArr, ...youhuiArr];
      let pramas = arr.map((item) => {
        return item.value;
      });
      this.setData({ show: false });
      this.triggerEvent("getItem", { pramas });
    },
    //处理配送方法
    handelPeisong(e) {
      let isSelected = e.currentTarget.dataset.isselected;
      let value = e.currentTarget.dataset.value;
      let peisongList = this.data.peisongList;
      for (let item of peisongList) {
        if (item.value == value) {
          item.selected = !isSelected;
        } else {
          if (!isSelected) {
            item.selected = false;
          }
        }
      }
      this.setData({
        peisongList,
      });
      this.sum();
    },
    //处理速度
    handelSudu(e) {
      let isSelected = e.currentTarget.dataset.isselected;
      let value = e.currentTarget.dataset.value;
      let velocityList = this.data.velocityList;
      for (let item of velocityList) {
        if (item.value == value) {
          item.selected = !isSelected;
        } else {
          if (!isSelected) {
            item.selected = false;
          }
        }
      }
      this.setData({
        velocityList,
      });
      this.sum();
    },
    //处理优惠活动
    handelYouhui(e) {
      let isSelected = e.currentTarget.dataset.isselected;
      let value = e.currentTarget.dataset.value;
      let preferentialList = this.data.preferentialList;
      for (let item of preferentialList) {
        if (item.value == value) {
          item.selected = !isSelected;
        } else {
          if (!isSelected) {
            item.selected = false;
          }
        }
      }
      this.setData({
        preferentialList,
      });
      this.sum();
    },
    handelCancel() {
      let peisongList = this.data.peisongList.map((item) => {
        item.selected = false;
        return item;
      });
      let velocityList = this.data.velocityList.map((item) => {
        item.selected = false;
        return item;
      });
      let preferentialList = this.data.preferentialList.map((item) => {
        item.selected = false;
        return item;
      });
      this.setData({
        show: false,
        peisongList,
        velocityList,
        preferentialList,
        isMember: false,
        chooseLength: 0,
      });
    },
    tapOne() {
      this.isDiatance = !this.isDiatance;
      this.setData({ isDiatance: this.isDiatance });
    },
    handelTap(e) {
      let type = e.currentTarget.dataset.type;
      if (type == "xl") {
        this.setData({
          xlColor: !this.data.xlColor,
          pfColor: false,
          memberColor: false,
        });
      } else if (type == "pf") {
        this.setData({
          pfColor: !this.data.pfColor,
          memberColor: false,
          xlColor: false,
        });
      } else if (type == "hy") {
        this.setData({
          memberColor: !this.data.memberColor,
          xlColor: false,
          pfColor: false,
        });
      }
      this.sum();
    },
  },
});
