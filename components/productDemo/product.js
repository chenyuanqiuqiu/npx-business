// pages/list/list.js
Component({
  /**
   * 组件的对外属性，是属性名到属性设置的映射表
   */
  properties: {
    list: {},
    isShow: {
      type: Boolean,
      default: false,
    },
  },

  lifetimes: {
    attached: function () {
      // 在组件实例进入页面节点树时执行
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },
});
