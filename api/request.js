let baseUrl;
const version = wx.getAccountInfoSync().miniProgram.envVersion;

switch (version) {
  //开发版
  case "develop":
    //填入自己当前项目的后端接口基础地址
    baseUrl = "";
    break;
  //体验版
  case "trial":
    //填入自己当前项目的后端接口基础地址
    baseUrl = "";
    break;
  //正式版
  case "release":
    baseUrl = "";
    break;
  default:
    break;
}

const request = (url, option) => {
  if (!url.includes(".//")) {
    url = url;
  }
  const TYPE = {
    JSON: "application/json",
    X_WWW_FORM_URLENCODED: "application/x-www-form-urlencoded",
  };
  return new Promise(async (resolve, reject) => {
    let token = "token";
    wx.request({
      url,
      method: option.method || "GET",
      data: option.data,
      header: {
        token: token,
        "Content-Type": TYPE.JSON,
        Cookie: "",
      },
      success: (res) => {
        if (res.data.code == 401) {
          reject("登录过期，请重新登录");
          wx.removeStorageSync(token);
          return;
        }
        resolve(res.data);
      },
      fail: (err) => {
        wx.getNetworkType({
          success: function (res) {
            if (res.networkType == "none") {
              wx.showToast({
                title: "请检查当前网络是否正常!",
                icon: "error",
                duration: 2000,
              });
            } else {
              wx.showToast({
                icon: "none",
                title: JSON.stringify(err),
                duration: 2000,
              });
            }
          },
        });
        reject(err);
      },
    });
  });
};
export default request;
