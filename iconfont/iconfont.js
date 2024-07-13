Component({
  properties: {
    // remen | remen1 | huangguanwangguanhuiyuanshenfendengjirenzhengmianxing | huiyuan | huiyuan1 | dianzihuiyuanbangdingtubiao_huaban1fuben | weishangchengmorentupian | a-shangdianshangchengxiaomaibujianzhufangzi | xiangxia1 | xiangxiamianxing | baoyou | shouhou1 | yingyezhizhao | shouhouwuyou | shijian | dianhua | bianjilan | huangjinhuiyuan | qiandao2 | shengchenghuiyiqiandaomaxiaoicon | qiandaobiao | gerenzhongxin_meiriqiandao | jifenqiandao | shouhuodizhi1 | shouhuodizhi2 | tuikuanshouhou | jifen11 | shezhi | zijinmingxi | daishouhuo | wuyoushouhou | daifukuan | daishouhuo1 | shouhou | daishouhuo2 | shouyegerenxinxitubiao | daishouhuo3 | qiandao | daipingjia | youhuiquan | gerenxinxi_1 | shanchu1 | shanchu | fanhui | shouye | shaixuan | shaixuanjiage | miaosha | xianshimiaosha-shouye | xianshimiaosha-jiagequ | xianshimiaosha | miaoshajindu | shangpinbiaoqian-miaosha | zu494 | jifenshangcheng | kuanchuangyidianzishangwutubiaoshiliangsucai-- | xiangshui | niunai | yutiyantoudi | niunaiping | jianmian | fapiao | circle-coupon | mianfei | fanli | zuigaofanlijifen | fan | tedianmianxi | teji | tehui | yuanyouhuiquan | zengyu | jian-copy | manzeng | mianfeishiyong | jian | jiaobiao_xin | zengpin | ziti | waimaipeisong | a-zeng1 | shoudan | mianze-01 | xiangxia | laba | jinritoutiao | 12 | waimai | huiyuanqia | shitangguanli | naicha | kefu | jianqu | shitang | zaocan | zaocan1 | sousuo | jiantou2 | qupiao | bianji | iconyinhangqiaguanli | shuaqiaqiapianyinhangqia | yonghuguanli1 | show_viphuiyuan | tishi | shangjiaguanli | yonghuguanli | jinggao | wuliupeisong- | peisongguanli- | shouhuodizhi | shenhe | shouhuo
    name: {
      type: String,
    },
    // string | string[]
    color: {
      type: null,
      observer: function(color) {
        this.setData({
          colors: this.fixColor(),
          isStr: typeof color === 'string',
        });
      }
    },
    size: {
      type: Number,
      value: 23,
      observer: function(size) {
        this.setData({
          svgSize: size / 750 * wx.getSystemInfoSync().windowWidth,
        });
      },
    },
  },
  data: {
    colors: '',
    svgSize: 23 / 750 * wx.getSystemInfoSync().windowWidth,
    quot: '"',
    isStr: true,
  },
  methods: {
    fixColor: function() {
      var color = this.data.color;
      var hex2rgb = this.hex2rgb;

      if (typeof color === 'string') {
        return color.indexOf('#') === 0 ? hex2rgb(color) : color;
      }

      return color.map(function (item) {
        return item.indexOf('#') === 0 ? hex2rgb(item) : item;
      });
    },
    hex2rgb: function(hex) {
      var rgb = [];

      hex = hex.substr(1);

      if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
      }

      hex.replace(/../g, function(color) {
        rgb.push(parseInt(color, 0x10));
        return color;
      });

      return 'rgb(' + rgb.join(',') + ')';
    }
  }
});
