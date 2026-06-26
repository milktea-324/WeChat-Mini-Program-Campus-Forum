const forumData = require("../../data/forum-data.js")
const forumStore = require("../../utils/forum-store.js")
const userStore = require("../../utils/user-store.js")

const DEFAULT_CURRENT_USER = {
  userId: "current-user",
  nickname: "\u5f53\u524d\u7528\u6237",
  avatar: "/images/avatar/default.png"
}

function getSafeCurrentUser() {
  try {
    const currentUser = userStore.getCurrentUser()
    const userId = String(currentUser && currentUser.userId || "").trim()
    const nickname = String(currentUser && currentUser.nickname || "").trim()
    const avatar = String(currentUser && currentUser.avatar || "").trim()

    return {
      userId: userId || DEFAULT_CURRENT_USER.userId,
      nickname: nickname || DEFAULT_CURRENT_USER.nickname,
      avatar: avatar || DEFAULT_CURRENT_USER.avatar
    }
  } catch (error) {
    return DEFAULT_CURRENT_USER
  }
}

Page({
  data: {
    title: "",
    content: "",
    contact: "",
    postImg: "",
    categoryIndex: 0,
    categoryNames: []
  },

  onLoad() {
    this.initCategory()
  },

  // 初始化分类，去掉“全部”
  initCategory() {
    let categoryList = forumData.categoryList || []

    let categoryNames = categoryList
      .filter(item => item.name !== "全部")
      .map(item => item.name)

    if (categoryNames.length === 0) {
      categoryNames = [
        "学习交流",
        "校园生活",
        "失物招领",
        "二手交易",
        "社团活动",
        "考试资料"
      ]
    }

    this.setData({
      categoryNames: categoryNames
    })
  },

  onTitleInput(event) {
    this.setData({
      title: event.detail.value
    })
  },

  onContentInput(event) {
    this.setData({
      content: event.detail.value
    })
  },

  onContactInput(event) {
    this.setData({
      contact: event.detail.value
    })
  },

  onCategoryChange(event) {
    this.setData({
      categoryIndex: Number(event.detail.value)
    })
  },

  // 选择封面
  onChooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: res => {
        const tempFilePath = res.tempFilePaths[0]

        wx.saveFile({
          tempFilePath: tempFilePath,
          success: saveRes => {
            this.setData({
              postImg: saveRes.savedFilePath
            })
          },
          fail: () => {
            // 如果保存失败，期末演示版可以先用临时路径
            this.setData({
              postImg: tempFilePath
            })
          }
        })
      }
    })
  },

  // 删除封面
  onDeleteCover() {
    this.setData({
      postImg: ""
    })
  },

  // 发布帖子
  onSubmit() {
    const title = this.data.title.trim()
    const content = this.data.content.trim()
    const contact = this.data.contact.trim()
    const postImg = this.data.postImg
    const category = this.data.categoryNames[this.data.categoryIndex]

    if (title === "") {
      wx.showToast({
        title: "标题不能为空",
        icon: "none"
      })
      return
    }

    if (content === "") {
      wx.showToast({
        title: "内容不能为空",
        icon: "none"
      })
      return
    }

    const newPostId = Date.now()

    let finalContent = content

    if (contact !== "") {
      finalContent = content + "\n\n联系方式：" + contact
    }

    const currentUser = getSafeCurrentUser()

    const newPost = {
      postId: newPostId,
      title: title,
      content: finalContent,
      category: category,
      authorId: currentUser.userId,
      author: currentUser.nickname,
      avatar: currentUser.avatar,
      postImg: postImg,
      collect: 0,
      date: this.getToday(),
      view: 0,
      like: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: false,
      isMine: true,
      comments: []
    }

    forumStore.addPost(newPost)
    forumStore.addMyPostId(newPostId)

    wx.showToast({
      title: "发布成功",
      icon: "success"
    })

    setTimeout(() => {
      wx.switchTab({
        url: "/pages/index/index"
      })
    }, 600)
  },

  // 清空表单
  onReset() {
    this.setData({
      title: "",
      content: "",
      contact: "",
      postImg: "",
      categoryIndex: 0
    })
  },

  getToday() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return year + "-" + month + "-" + day
  }
})
