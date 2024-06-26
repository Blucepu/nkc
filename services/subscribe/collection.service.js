const { subscribeService } = require('./subscribe.service');
const { subscribeSources } = require('../../settings/subscribe');
const { ResponseTypes } = require('../../settings/response');
const { ThrowBadRequestResponseTypeError } = require('../../nkcModules/error');

class CollectionService {
  async isCollectedThread(uid, tid) {
    return await subscribeService.isSubscribed({
      uid,
      source: subscribeSources.collectionThread,
      sid: tid,
    });
  }

  async isCollectedArticle(uid, aid) {
    return await subscribeService.isSubscribed({
      uid,
      source: subscribeSources.collectionArticle,
      sid: aid,
    });
  }
  async isCollectedPost(uid, pid) {
    return await subscribeService.isSubscribed({
      uid,
      source: subscribeSources.collectionPost,
      sid: pid,
    });
  }
  async isCollectedComment(uid, cid) {
    return await subscribeService.isSubscribed({
      uid,
      source: subscribeSources.collectionComment,
      sid: cid,
    });
  }

  async checkWhenCollectThread(uid, tid) {
    const isCollected = await this.isCollectedThread(uid, tid);
    if (isCollected) {
      ThrowBadRequestResponseTypeError(
        ResponseTypes.FORBIDDEN_BECAUSE_COLLECTED_THREAD,
      );
    }
  }

  async checkWhenCollectArticle(uid, aid) {
    const isCollected = await this.isCollectedArticle(uid, aid);
    if (isCollected) {
      ThrowBadRequestResponseTypeError(
        ResponseTypes.FORBIDDEN_BECAUSE_COLLECTED_THREAD,
      );
    }
  }

  async checkWhenCollectPost(uid, pid) {
    const isCollected = await this.isCollectedPost(uid, pid);
    if (isCollected) {
      ThrowBadRequestResponseTypeError(
        ResponseTypes.FORBIDDEN_BECAUSE_COLLECTED_THREAD,
      );
    }
  }

  async checkWhenCollectComment(uid, cid) {
    const isCollected = await this.isCollectedComment(uid, cid);
    if (isCollected) {
      ThrowBadRequestResponseTypeError(
        ResponseTypes.FORBIDDEN_BECAUSE_COLLECTED_THREAD,
      );
    }
  }

  async collectThread(uid, tid, cid = []) {
    return await subscribeService.createSubscribe({
      source: subscribeSources.collectionThread,
      sid: tid,
      uid,
      cid,
    });
  }

  async collectArticle(uid, aid, cid = []) {
    return await subscribeService.createSubscribe({
      source: subscribeSources.collectionArticle,
      sid: aid,
      uid,
      cid,
    });
  }

  async collectPost(uid, pid, cid = []) {
    return await subscribeService.createSubscribe({
      source: subscribeSources.collectionPost,
      sid: pid,
      uid,
      cid,
    });
  }

  async collectComment(uid, id, cid = []) {
    return await subscribeService.createSubscribe({
      source: subscribeSources.collectionComment,
      sid: id,
      uid,
      cid,
    });
  }
  async unCollectThread(uid, tid) {
    await subscribeService.cancelSubscribe({
      uid,
      source: subscribeSources.collectionThread,
      sid: tid,
    });
  }

  async unCollectArticle(uid, aid) {
    await subscribeService.cancelSubscribe({
      uid,
      source: subscribeSources.collectionArticle,
      sid: aid,
    });
  }
  async unCollectPost(uid, aid) {
    await subscribeService.cancelSubscribe({
      uid,
      source: subscribeSources.collectionPost,
      sid: aid,
    });
  }
  async unCollectComment(uid, cid) {
    await subscribeService.cancelSubscribe({
      uid,
      source: subscribeSources.collectionComment,
      sid: cid,
    });
  }

  async getCollectedThreadCategoriesId(uid, tid) {
    let cid = [];
    const subscribe = await subscribeService.getUserSubscribeBySource({
      uid,
      source: subscribeSources.collectionThread,
      sid: tid,
    });
    if (subscribe) {
      cid = subscribe.cid;
    }
    return cid;
  }

  async getCollectedArticleCategoriesId(uid, aid) {
    let cid = [];
    const subscribe = await subscribeService.getUserSubscribeBySource({
      uid,
      source: subscribeSources.collectionArticle,
      sid: aid,
    });
    if (subscribe) {
      cid = subscribe.cid;
    }
    return cid;
  }
  async getCollectedPostCategoriesId(uid, pid) {
    let cid = [];
    const subscribe = await subscribeService.getUserSubscribeBySource({
      uid,
      source: subscribeSources.collectionPost,
      sid: pid,
    });
    if (subscribe) {
      cid = subscribe.cid;
    }
    return cid;
  }
  async getCollectedCommentCategoriesId(uid, id) {
    let cid = [];
    const subscribe = await subscribeService.getUserSubscribeBySource({
      uid,
      source: subscribeSources.collectionComment,
      sid: id,
    });
    if (subscribe) {
      cid = subscribe.cid;
    }
    return cid;
  }
}

module.exports = {
  collectionService: new CollectionService(),
};
