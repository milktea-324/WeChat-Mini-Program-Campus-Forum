const forumData = require("../../data/forum-data.js")

Page({
  data: {
    user: {
      nickname: "校园用户",
      avatar: "/images/avatar/default.png"
    },
    currentTab: "my",
    posts: [],
    myPostList: [],
    collectList: [],
    likeList: [],
    showList: [],
    emptyText: ""
  },

  onShow() {
    this.loadData()
  },

  // 加载个人页数据
  loadData() {
    let posts = wx.getStorageSync("forum_posts")

    if (!posts || posts.length === 0) {
      posts = forumData.postList || []
      wx.setStorageSync("forum_posts", posts)
    }

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

  // 切换列表
  onChangeTab(event) {
    const tab = event.currentTarget.dataset.tab

    this.setData({
      currentTab: tab
    })

    this.updateShowList()
  },

  // 根据当前 tab 更新展示列表
  updateShowList() {
    const currentTab = this.data.currentTab

    let showList = []
    let emptyText = ""

    if (currentTab === "my") {
      showList = this.data.myPostList
      emptyText = "你还没有发布帖子"
    }

    if (currentTab === "collect") {
      showList = this.data.collectList
      emptyText = "你还没有收藏帖子"
    }

    if (currentTab === "like") {
      showList = this.data.likeList
      emptyText = "你还没有点赞帖子"
    }

    this.setData({
      showList: showList,
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