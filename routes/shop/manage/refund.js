const Router = require('koa-router');
const router = new Router();
const { OnlyUnbannedUser } = require('../../../middlewares/permission');
router
  .use('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { query, method, data, db, body } = ctx;
    const { user } = data;
    let orderId;
    if (['GET', 'DELETE'].includes(method)) {
      orderId = query.orderId;
    } else {
      orderId = body.orderId;
    }
    const order = await db.ShopOrdersModel.findById(orderId);
    if (order.sellUid !== user.uid) {
      ctx.throw(400, '权限不足，您不是订单中商品的卖家');
    }
    data.order = order;
    await next();
  })
  .get('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { db, data } = ctx;
    let { order } = data;
    await order.extendCerts('seller');
    // 获取该订单的全部退款申请记录
    const refunds = await db.ShopRefundModel.find({
      orderId: order.orderId,
      sellerId: order.sellUid,
      buyerId: order.buyUid,
    }).sort({ toc: 1 });
    if (refunds.length !== 0) {
      if (refunds[refunds.length - 1].succeed === null) {
        data.refund = refunds[refunds.length - 1];
      }
    }
    await db.ShopRefundModel.extendLogs(refunds, ctx.state.lang);
    if (data.refund && data.refund.paramId) {
      data.param = await order.getParamById(data.refund.paramId);
    }
    const orders = await db.ShopOrdersModel.userExtendOrdersInfo([order]);
    order = (await db.ShopOrdersModel.translateOrderStatus(orders))[0];
    data.dealInfo = await db.ShopDealInfoModel.findOne({ uid: data.user.uid });
    data.order = order;
    data.refunds = refunds;
    ctx.template = 'shop/manage/refund/refund.pug';
    await next();
  })
  .post('/', OnlyUnbannedUser(), async (ctx, next) => {
    const { data, db, body, tools } = ctx;
    const { order, user } = data;
    const { type, reason, certsId, password, sellerInfo } = body;
    const refund = await db.ShopRefundModel.findOne({
      orderId: order.orderId,
    }).sort({ toc: -1 });
    if (!refund) {
      ctx.throw(404, `订单【${order.orderId}】不存在退款申请`);
    }
    let param;
    if (refund.paramId) {
      param = await order.getParamById(refund.paramId);
    }

    if (type === 'agreeRM') {
      // 卖家同意退款

      // 验证卖家的登录密码
      const userPersonal = await db.UsersPersonalModel.findOnly({
        uid: user.uid,
      });
      const { hashType } = userPersonal;
      const { hash, salt } = userPersonal.password;
      switch (hashType) {
        case 'pw9':
          if (tools.encryption.encryptInMD5WithSalt(password, salt) !== hash) {
            ctx.throw(400, '密码错误, 请重新输入');
          }
          break;
        case 'sha256HMAC':
          if (
            tools.encryption.encryptInSHA256HMACWithSalt(password, salt) !==
            hash
          ) {
            ctx.throw(400, '密码错误, 请重新输入');
          }
          break;
        default:
          ctx.throw(400, '未知的密码加密类型');
      }

      await refund.sellerAgreeRM(reason);
      // await db.ShopProductsParamModel.refundRestoreStock(refund);
    } else if (type === 'disagreeRM') {
      // 卖家拒绝退款
      await refund.sellerDisagreeRM(reason);
    } else if (type === 'agreeRP') {
      // 卖家同意退货
      if (sellerInfo.name === '') {
        ctx.throw(400, '收件人姓名不能为空');
      }
      if (sellerInfo.mobile === '') {
        ctx.throw(400, '收件人手机号不能为空');
      }
      if (sellerInfo.address === '') {
        ctx.throw(400, '收件人地址不能为空');
      }
      await refund.sellerAgreeRP(reason, sellerInfo);
    } else if (type === 'uploadCerts') {
      const { status } = refund;
      const time = Date.now();
      let newStatus = '';
      if (status === 'B_INPUT_CERT_RM') {
        newStatus = 'P_APPLY_RM';
      } else {
        ctx.throw(400, '用户未申请平台接入，请刷新');
      }
      if (reason && tools.checkString.contentLength(reason) > 1000) {
        ctx.throw(400, '理由不能超过100字节');
      }
      // 卖家上传完凭证
      await db.ShopCertModel.updateMany(
        {
          _id: { $in: certsId },
          uid: user.uid,
          orderId: order.orderId,
          deletable: true,
          type: 'refund',
          paramId: param ? param.costId : '',
        },
        {
          $set: {
            deletable: false,
          },
        },
      );
      await db.ShopRefundModel.updateOne(
        { _id: refund._id },
        {
          $set: {
            tlm: time,
            status: newStatus,
          },
          $addToSet: {
            logs: {
              status: newStatus,
              info: reason,
              time,
            },
          },
        },
      );
      await db.MessageModel.sendShopMessage({
        type: 'shopBuyerRefundChange',
        r: refund.buyerId,
        orderId: refund.orderId,
        refundId: refund._id,
      });
    } else if (type === 'disagreeRP') {
      // 卖家拒绝退货
      await refund.sellerDisagreeRP(reason);
    } else {
      ctx.throw(400, `未知的操作类型 type=${type}`);
    }
    await next();
  });
module.exports = router;
