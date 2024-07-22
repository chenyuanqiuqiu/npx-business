const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 设定时间内，没有再次触发某函数，才真正调用该函数（输入框搜索功能，按钮点击功能，浏览器滚动功能）
 * @param {*} fn 要执行的函数
 * @param {*} delay 延迟时间
 * @param {*} immediate 是否立即执行
 * @returns 
 */
const debounce = (fn,delay,immediate=false)=>{
  let timer = null;
  let isInvoke = false;//是否已执行过函数
  const _debounce = function (...args) {
    return new Promise((resolve,reject)=>{
      if (timer){
        clearTimeout(timer); //取消上一个的定时器
      }
      if(immediate && !isInvoke){
        const result = fn.apply(this,args)
        isInvoke = true;
        resolve(result)
      } else {
        timer = setTimeout(()=>{
          const result = fn.apply(this,args);
          isInvoke = false;
          timer = null;
          resolve(result)
        },delay)
      }
    })
  }
  return _debounce;
}

/**
 * 短时间内只执行一次函数
 * @param {*} fn 要执行的函数
 * @param {*} interval 时间间隔
 * @param {*} options 可选参数： leading第一次是否执行,trailing最后一次是否执行
 * @returns 
 */
const throttle = (fn,interval,options={leading:true,trailing:false}) => {
  let lastTime = 0;
  let {leading,trailing} = options;
  let timer = null;
  const _throttle = function(...args) {
    return new Promise((resolve,reject)=>{
      const nowTime = new Date().getTime();

      //当lastTime为0时且第一次不执行，此时 remainTime = interval - (nowTime - lastTime) = interval > 0 
      if (lastTime==0 && !leading) {
        lastTime = nowTime
      }
      // 使用当前触发的时间和之前的时间间隔以及上一次开始的时间, 计算出还剩余多长事件需要去触发函数
      const remainTime = interval - (nowTime - lastTime);
      if (remainTime <=0){
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        const result = fn.apply(this,args);
        lastTime = nowTime;
        resolve(result)
      }
      if (!timer && trailing){
        timer = setTimeout(()=>{
          const result = fn.apply(this,args);
          lastTime = leading ? 0 : new Date().getTime();
          timer = null;
          resolve(result)
        },remainTime)
      }
    })
    
  }
  return _throttle;
}
Function.prototype.myCall = function (thisArg, ...args) {
  let fn = this;
  thisArg = (thisArg != undefined && thisArg != null) ? Object(thisArg) : window;
  thisArg.fn = fn;
  const result = thisArg.fn(...args)
  delete thisArg.fn;
  return result
}

const obj = {
  age:12,
  name:"johy",
  hobby:"swimming"
}
Object.keys(obj).forEach(key=>{
  let value = obj[key];
  Object.defineProperty(obj,key,{
    get(){
      return value;
    },
    set(newValue){
      if(value==newValue) return
      value = newValue
    }
  })
})

const objProxy = new Proxy((obj,{
  get(target,key,receiver){
    return Reflect.get(target,key,receiver)
  },
  set(target,key,value,receiver){
    if(target[key]!=value){
      return Reflect.set(target,key,value,receiver)
    }
  },
  has(target,key){
    return Reflect.has(target,key)
  },
  deleteProperty(target,key){
    return Reflect.deleteProperty(target,key)
  }
}))
module.exports = {
  formatTime,
  debounce,
  throttle
}
