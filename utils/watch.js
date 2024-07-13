/**
 * 监听器模块，用于监听数据对象的属性变化
 */

function watch(context, variableName, callback) {
  let value = context.data[variableName]; // 获取被监听属性的当前值

  // 使用 Object.defineProperty 方法在数据对象上定义属性的 getter 和 setter
  Object.defineProperty(context.data, variableName, {
    configurable: true, // 可配置
    enumerable: true, // 可枚举
    get: function () {
      return value; // 返回属性的当前值
    },
    set: function (newVal) {
      const oldVal = value; // 记录属性的旧值
      value = newVal; // 更新属性的值
      callback.call(context, newVal, oldVal); // 调用回调函数，传递新值和旧值
    },
  });
}

module.exports = {
  watch: watch,
};
