const forumData = require("../../data/forum-data.js")

Page({
  data: {
    swiperList: [],
    categoryList: [],
    postList: [],
    showPostList: [],
    currentCategory: "全部",
    keyword: ""
  },

  onLoad() {
    this.initForumData()
  },

  onShow() {
    this.loadPosts()
  },

  // 初始化数据
  initForumData() {
    const storagePosts = wx.getStorageSync("forum_posts")

    if (!storagePosts || storagePosts.length === 0) {
      wx.setStorageSync("forum_posts", forumData.postList)
    }

    this.setData({
      swiperList: forumData.swiperList,
      categoryList: forumData.categoryList
    })
  },

  // 加载帖子
  loadPosts() {
    const posts = wx.getStorageSync("forum_posts") || forumData.postList

    this.setData({
      postList: posts
    })

    this.filterPosts()
  },

  // 搜索输入
  onSearchInput(event) {
    this.setData({
      keyword: event.detail.value
    })

    this.filterPosts()
  },

  // 点击分类
  onTapCategory(event) {
    const category = event.currentTarget.dataset.category

    this.setData({
      currentCategory: category
    })

    this.filterPosts()
  },

  // 筛选帖子
  filterPosts() {
    const { postList, currentCategory, keyword } = this.data

    let result = postList

    if (currentCategory !== "全部") {
      result = result.filter(item => item.category === currentCategory)
    }

    if (keyword.trim() !== "") {
      const key = keyword.trim()
      result = result.filter(item => {
        return item.title.includes(key) || item.content.includes(key) || item.author.includes(key)
      })
    }

    this.setData({
      showPostList: result
    })
  },

  // 点击帖子
onTapPost(event) {
  const postId = event.currentTarget.dataset.postId

  wx.navigateTo({
    url: "/pages/detail/detail?postId=" + postId
  })
}
})