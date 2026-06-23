const forumData = require("../../data/forum-data.js")

Page({
  data: {
    user: {
      nickname: "校园用户",
      avatar: "/images/avatar/default.png"
    },

    currentTab: "my",
    currentCategory: "全部",
    keyword: "",

    categoryList: [],

    posts: [],
    myPostList: [],
    collectList: [],
    likeList: [],
    showList: [],

    tabTitle: "我的发布",
    emptyText: ""
  },

  onLoad() {
    this.initCategory()
  },

  onShow() {
    this.loadData()
  },

  // 初始化分类
  initCategory() {
    let categoryList = forumData.categoryList || []

    if (!categoryList || categoryList.length === 0) {
      categoryList = [
        { id: 0, name: "全部" },
        { id: 1, name: "学习交流" },
        { id: 2, name: "校园生活" },
        { id: 3, name: "失物招领" },
        { id: 4, name: "二手交易" },
        { id: 5, name: "社团活动" },
        { id: 6, name: "考试资料" }
      ]
    }

    this.setData({
      categoryList: categoryList
    })
  },

  // 加载个人页数据
  loadData() {
    let posts = wx.getStorageSync("forum_posts")

    if (!posts || posts.length === 0) {
      posts = forumData.postList || []
      wx.setStorageSync("forum_posts", posts)
    }

    // 兼容旧数据，避免字段缺失导致页面报错
    posts = posts.map(item => {
      return Object.assign({
        view: 0,
        like: 0,
        commentCount: 0,
        isLiked: false,
        isCollected: false,
        isMine: false,
        comments: []
      }, item)
    })

    const myPostIds = wx.getStorageSync("forum_my_posts") || []

    const myPostList = posts.filter(item => {
      return item.isMine || myPostIds.includes(item.postId)
    })

    const collectList = posts.filter(item => item.isCollected)

    const likeList = posts.filter(item => item.isLiked)

    this.setData({
      posts: posts,
      myPostList: myPostList,
      collectList: collectList,
      likeList: likeList
    })

    this.updateShowList()
  },

  // 切换 我的发布 / 我的收藏 / 我的点赞
  onChangeTab(event) {
    const tab = event.currentTarget.dataset.tab

    this.setData({
      currentTab: tab
    })

    this.updateShowList()
  },

  // 搜索输入
  onSearchInput(event) {
    this.setData({
      keyword: event.detail.value
    })

    this.updateShowList()
  },

  // 点击分类
  onTapCategory(event) {
    const category = event.currentTarget.dataset.category

    this.setData({
      currentCategory: category
    })

    this.updateShowList()
  },

  // 根据 tab、分类、搜索词更新展示列表
  updateShowList() {
    const {
      currentTab,
      currentCategory,
      keyword,
      myPostList,
      collectList,
      likeList
    } = this.data

    let baseList = []
    let tabTitle = ""
    let emptyText = ""

    if (currentTab === "my") {
      baseList = myPostList
      tabTitle = "我的发布"
      emptyText = "你还没有发布帖子"
    }

    if (currentTab === "collect") {
      baseList = collectList
      tabTitle = "我的收藏"
      emptyText = "你还没有收藏帖子"
    }

    if (currentTab === "like") {
      baseList = likeList
      tabTitle = "我的点赞"
      emptyText = "你还没有点赞帖子"
    }

    let result = baseList

    // 分类筛选
    if (currentCategory !== "全部") {
      result = result.filter(item => item.category === currentCategory)
    }

    // 关键词搜索
    if (keyword.trim() !== "") {
      const key = keyword.trim()

      result = result.filter(item => {
        return (
          item.title.includes(key) ||
          item.content.includes(key) ||
          item.author.includes(key) ||
          item.category.includes(key)
        )
      })
    }

    // 空状态区分：原本没有数据，还是筛选后没有结果
    if (baseList.length > 0 && result.length === 0) {
      emptyText = "当前筛选条件下没有帖子"
    }

    this.setData({
      showList: result,
      tabTitle: tabTitle,
      emptyText: emptyText
    })
  },

  // 点击帖子进入详情页
  onTapPost(event) {
    const postId = event.currentTarget.dataset.postId

    wx.navigateTo({
      url: "/pages/detail/detail?postId=" + postId
    })
  }
})