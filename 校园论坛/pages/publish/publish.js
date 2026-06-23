const forumData = require("../../data/forum-data.js")

Page({
  data: {
    title: "",
    content: "",
    contact: "",
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

  // 发布帖子
  onSubmit() {
    const title = this.data.title.trim()
    const content = this.data.content.trim()
    const contact = this.data.contact.trim()
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

    let posts = wx.getStorageSync("forum_posts")

    if (!posts || posts.length === 0) {
      posts = forumData.postList || []
    }

    const newPostId = Date.now()

    let finalContent = content

    if (contact !== "") {
      finalContent = content + "\n\n联系方式：" + contact
    }

    const newPost = {
      postId: newPostId,
      title: title,
      content: finalContent,
      category: category,
      author: "当前用户",
      avatar: "/images/avatar/default.png",
      postImg: "/images/post/bl.png",
      date: this.getToday(),
      view: 0,
      like: 0,
      commentCount: 0,
      isLiked: false,
      isCollected: false,
      isMine: true,
      comments: []
    }

    posts.unshift(newPost)

    wx.setStorageSync("forum_posts", posts)

    const myPostIds = wx.getStorageSync("forum_my_posts") || []
    myPostIds.unshift(newPostId)
    wx.setStorageSync("forum_my_posts", myPostIds)

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