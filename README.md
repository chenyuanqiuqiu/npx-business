# npx-business
<!-- util.js新增防抖debounce 和 节流方法throttle -->
<script>
    //节流调用
    const throttleChange = throttle(inputChange, 3000, {
      leading: false,
      trailing: true
    })
    const tempCallback = function (...args) {
      throttleChange.apply(this, args).then(res => {//此时this绑定的是input对象
        console.log("Promise的返回值结果:", res)
      })
    }
    // 防抖调用
    const debounceChange = debounce(inputChange, 3000, false)//相当于_debounce
    const tempCallback = function (...args) {
      debounceChange.apply(this, args).then(res => {//此时this绑定的是input对象
        console.log("Promise的返回值结果:", res)
      })
    }
</script>