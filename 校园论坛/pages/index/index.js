const forumData = require("../../data/forum-data.js")
const postFilter = require("../../utils/post-filter.js")
// 脚本自动补齐评论
const mockComments = require("../../utils/mock-comments.js")
const mockUsers = require("../../utils/mock-users.js")

Page({
  data: {
    bannerList: [],
    categoryList: [],
    postList: [],
    showPostList: [],
    currentCategory: "全部",
    keyword: "",
    emptyText: "没有找到相关帖子",

    timeRangeIndex: 0,
    sortIndex: 0,
    timeRangeList: [],
    sortList: [],
    timeRangeNames: [],
    sortNames: []
  },

  onLoad() {
    this.initForumData()
    this.initSortOptions()
  },

  onShow() {
    this.loadPosts()
  },

  // 初始化排序选项
  initSortOptions() {
    const timeRangeList = postFilter.timeRangeList
    const sortList = postFilter.sortList

    this.setData({
      timeRangeList: timeRangeList,
      sortList: sortList,
      timeRangeNames: timeRangeList.map(item => item.label),
      sortNames: sortList.map(item => item.label)
    })
  },

  // 修改时间范围
  onTimeRangeChange(event) {
    this.setData({
      timeRangeIndex: Number(event.detail.value)
    })

    this.filterPosts()
  },

  // 修改排序条件
  onSortChange(event) {
    this.setData({
      sortIndex: Number(event.detail.value)
    })

    this.filterPosts()
  },

  // 初始化数据
  initForumData() {
    const storagePosts = wx.getStorageSync("forum_posts")

    if (!storagePosts || storagePosts.length === 0) {
      const postsWithComments = mockComments.fillMockComments(forumData.postList)
      const userResult = mockUsers.fillMockUsers(postsWithComments)
      const posts = userResult.posts

      wx.setStorageSync("forum_posts", posts)
    }

    this.setData({
      categoryList: forumData.categoryList
    })
  },

  // 加载帖子
  loadPosts() {
    let posts = wx.getStorageSync("forum_posts") || forumData.postList

    posts = mockComments.fillMockComments(posts)

    posts = posts.map(item => {
      return Object.assign({
        view: 0,
        like: 0,
        collect: 0,
        commentCount: 0,
        isLiked: false,
        isCollected: false,
        isMine: false,
        comments: [],
        postImg: ""
      }, item)
    })

    const userResult = mockUsers.fillMockUsers(posts)
    posts = userResult.posts

    wx.setStorageSync("forum_posts", posts)

    this.setData({
      postList: posts,
      bannerList: this.getHotBannerList(posts)
    })

    this.filterPosts()
  },

  // 获取热度前三的帖子作为轮播图
  getHotBannerList(posts) {
    const list = posts.map(item => {
      return Object.assign({}, item, {
        _heat: postFilter.getHeat(item)
      })
    })

    list.sort((a, b) => {
      if (b._heat !== a._heat) {
        return b._heat - a._heat
      }

      const timeA = new Date((a.date || "").replace(/-/g, "/")).getTime() || 0
      const timeB = new Date((b.date || "").replace(/-/g, "/")).getTime() || 0

      return timeB - timeA
    })

    return list.slice(0, 3).map(item => {
      delete item._heat
      return item
    })
  },

  // 点击轮播图进入详情页
  onTapBanner(event) {
    const postId = event.currentTarget.dataset.postId

    if (!postId) {
      return
    }

    wx.navigateTo({
      url: "/pages/detail/detail?postId=" + postId
    })
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

  // 筛选和排序帖子
  filterPosts() {
    const {
      postList,
      currentCategory,
      keyword,
      timeRangeIndex,
      sortIndex,
      timeRangeList,
      sortList
    } = this.data

    const timeRange = timeRangeList[timeRangeIndex]
      ? timeRangeList[timeRangeIndex].value
      : "all"

    const sortType = sortList[sortIndex]
      ? sortList[sortIndex].value
      : "heat"

    const result = postFilter.filterAndSortPosts(postList, {
      category: currentCategory,
      keyword: keyword,
      timeRange: timeRange,
      sortType: sortType
    })

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
  },

  // 点击作者头像进入作者主页
  onTapAuthor(event) {
    const authorId = event.currentTarget.dataset.authorId
    const isCurrentUser = event.currentTarget.dataset.isCurrentUser === true ||
      event.currentTarget.dataset.isCurrentUser === "true"

    if (isCurrentUser || authorId === mockUsers.CURRENT_USER_ID) {
      wx.showToast({
        title: "不能进入自己的作者页",
        icon: "none"
      })
      return
    }

    const url = mockUsers.getAuthorProfileUrl({
      userId: authorId
    })

    if (!url) {
      return
    }

    wx.navigateTo({
      url: url
    })
  }
})
