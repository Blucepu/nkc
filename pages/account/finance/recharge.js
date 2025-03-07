const data = NKC.methods.getDataById('data');
const math = NKC.modules.math;
let defaultKCB = [10, 20, 50, 100, 500];
window.rechargeApp = new Vue({
  el: '#app',
  data: {
    defaultKCB: defaultKCB.filter(d => {
      return (
        d >= data.rechargeSettings.min / 100 && d <= data.rechargeSettings.max / 100
      );
    }),
    money: 10,
    error: '',
    payment: '',
    input: '',
    mainScore: data.mainScore,
    rechargeSettings: data.rechargeSettings,
  },
  computed: {
    payments() {
      const arr = [];
      const {weChat, aliPay} = this.rechargeSettings;
      if(aliPay.enabled) arr.push({
        type: 'aliPay',
        name: '支付宝'
      });
      if(weChat.enabled) arr.push({
        type: 'weChat',
        name: '微信支付'
      });
      return arr;
    },
    payInfo() {
      const {payment, rechargeSettings} = this;
      if(!payment) return;
      const pay = rechargeSettings[payment];
      if(pay.enabled && pay.fee > 0) {
        const fee = math.chain(math.bignumber(pay.fee)).multiply(100).done().toNumber();
        return `服务商（非本站）将收取 ${fee}% 的手续费`
      }
    },
    fee() {
      const {totalPrice, finalPrice} = this;
      if(totalPrice) {
        return totalPrice - finalPrice;
      }
    },
    finalPrice() {
      const {money, input} = this;
      let m = 0;
      if(input) {
        m = input;
      } else if(money) {
        m = money;
      }
      if(m) {
        m = Math.ceil(m * 100);
      }
      return m;
    },
    totalPrice() {
      let fee = 0;
      const {payment, rechargeSettings} = this;
      const pay = rechargeSettings[payment];
      if(pay) {
        if(this.finalPrice) {
          fee = this.finalPrice * (1 + pay.fee);
          fee = Math.ceil(fee);
        }
      }
      return fee;
    },
  },
  mounted() {
    if(this.payments.length) {
      this.selectPayment(this.payments[0].type);
    }
  },
  methods: {
    inputNumber() {
      this.input = parseFloat(this.input.toFixed(2));
    },
    select: function(m) {
      this.money = m;
    },
    selectPayment: function(t) {
      this.payment = t;
    },
    toPay: function() {
      const {payment, finalPrice, totalPrice, rechargeSettings} = this;
      const {min, max} = rechargeSettings;
      let newWindow;
      let apiType = '';
      if(NKC.methods.isPcBrowser()){
        apiType='native';
      }else{
        if(navigator.userAgent.indexOf("MicroMessenger")>0){
          apiType='jsApi';
        }else{
          apiType='H5';
        }
      }
      return Promise.resolve()
        .then(() => {
          if(totalPrice < min) {
            throw new Error(`充值金额不能小于${min / 100}元`);
          }
          if(totalPrice > max) {
            throw new Error(`充值金额不能大于${max / 100}元`);
          }
          if(
            NKC.methods.isPcBrowser() ||
            NKC.methods.isMobilePhoneBrowser()
          ) {
            newWindow = window.open();
          }
          return nkcAPI('/account/finance/recharge/payment', 'POST', {
            apiType,
            paymentType: payment,
            totalPrice,
            finalPrice
          });
        })
        .then(res => {
          const {wechatPaymentInfo, aliPaymentInfo} = res;
          if(wechatPaymentInfo) {
            if( apiType==='jsApi'){
              newWindow.location = wechatPaymentInfo.url;
            }else{
              NKC.methods.toPay('wechatPay', wechatPaymentInfo, newWindow);
            }
          } else if(aliPaymentInfo) {
            NKC.methods.toPay('aliPay', aliPaymentInfo, newWindow);
          }
          sweetInfo('请在浏览器新打开的窗口完成支付！若没有新窗口打开，请检查新窗口是否已被浏览器拦截。');
        })
        .catch(err => {
          if(newWindow && newWindow.close) newWindow.close();
          sweetError(err);
        })
    },
    pay: function() {
      const {totalPrice, payment, finalPrice} = this;
      let newWindow;
      let redirect = false;
      const isPhone = NKC.methods.isPhone();
      let url = `/account/finance/recharge?type=get_url&money=${totalPrice}&score=${finalPrice}&payment=${payment}`;
      Promise.resolve()
        .then(() => {
          if(!['aliPay', 'weChat'].includes(payment)) throw '请选择支付方式';
          if(totalPrice > 0) {}
          else {
            throw '充值金额必须大于0';
          }
          if(NKC.configs.platform !== 'reactNative') {
            if(isPhone) {
              url += '&redirect=true';
              screenTopAlert('正在前往支付宝...')
              redirect = true;
              return window.location.href = url;
            } else {
              newWindow = window.open();
            }
          }
          return nkcAPI(url, 'GET');
        })
        .then(data => {
          if(redirect) return;
          if(NKC.configs.platform === 'reactNative') {
            NKC.methods.visitUrl(data.url, true);
          } else {
            newWindow.location = data.url;
          }
          sweetInfo('请在浏览器新打开的窗口完成支付！若没有新窗口打开，请检查新窗口是否已被浏览器拦截。');
        })
        .catch(err => {
          sweetError(err)
          if(newWindow) {
            newWindow.document.body.innerHTML = err.error || err;
          }
        });
    }
  }
});
