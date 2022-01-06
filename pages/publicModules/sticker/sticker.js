class StickerViewer {
  constructor() {
    const self = this;
    self.dom = $("#moduleStickerViewer");
    self.dom.modal({
      show: false
    });
    self.app = new Vue({
      el: "#moduleStickerViewerApp",
      data: {
        sticker: "",
        uid: NKC.configs.uid,
        management: false,
        loading: false,
        notesAboutUploading: ''
      },
      mounted() {
        this.init();
      },
      methods: {
        getUrl: NKC.methods.tools.getUrl,
        fromNow: NKC.methods.fromNow,
        collection() {
          nkcAPI(`/sticker`, "POST", {
            type: "collection",
            stickersId: [this.sticker._id]
          })
            .then(function() {
              self.app.close();
              sweetSuccess("表情已添加");
            })
            .catch(sweetError);
        },
        moveSticker() {
          const {sticker} = this;
          const body = {
            type: "move",
            stickersId: [sticker.collected._id]
          };
          nkcAPI("/sticker", "POST", body)
            .then(() => {
              self.app.close();
              window.location.reload();
            })
            .catch(sweetError);
        },
        shareSticker() {
          const {sticker} = this;
          const body = {
            type: "share",
            stickersId: [sticker._id]
          };
          nkcAPI("/sticker", "POST", body)
            .then(() => {
              sweetSuccess("操作成功");
            })
            .catch(sweetError);
        },
        removeSticker() {
          const {sticker} = this;
          sweetQuestion(`确定要删除表情？`)
            .then(() => {
              const body = {
                type: "delete",
                stickersId: [sticker.collected._id]
              };
              return nkcAPI("/sticker", "POST", body);
            })
            .then(() => {
              self.app.close();
              window.location.reload();
            })
            .catch(sweetError);
        },
        init() {
          // 旧 数据统一后可移除
          const dom = $("[data-sticker-rid]");

          for(let i = 0; i < dom.length; i++) {
            const d = dom.eq(i);
            if(d.attr("data-sticker-init") === "true") continue;
            d.on("click", function() {
              self.app.open($(this).attr("data-sticker-rid"), !!$(this).attr("data-sticker-management"));
            });
            d.attr("data-sticker-init", "true");
          }

          // 新
          const dom2 = $("span[data-tag='nkcsource'][data-type='sticker']");
          dom2.each(function() {
            const d = $(this);
            if(d.attr("data-sticker-init") === "true") return;
            d.on("click", function() {
              self.app.open($(this).attr("data-id"), !!$(this).attr("data-sticker-management"));
            });
            d.attr("data-sticker-init", "true");
          });
        },
        open(rid, management) {
          self.app.management = !!management;
          self.dom.modal("show");
          this.loading = true;
          nkcAPI(`/sticker/${rid}?t=json`, "GET")
            .then(data => {
              self.app.sticker = data.sticker;
              self.app.loading = false;
              self.app.notesAboutUploading = data.notesAboutUploading;
            })
            .catch(data => {
              sweetError(data);
              self.app.close();
            });
        },
        close() {
          self.dom.modal("hide");
        }
      }
    });
    self.initPanel = self.app.init;
  }
}
const stickerViewer = new StickerViewer();
NKC.methods.initStickerViewer = stickerViewer.app.init;
