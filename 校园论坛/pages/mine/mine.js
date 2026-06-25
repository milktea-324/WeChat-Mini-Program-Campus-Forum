const forumData = require("../../data/forum-data.js")
const postFilter = require("../../utils/post-filter.js")
const mockUsers = require("../../utils/mock-users.js")
const forumStore = require("../../utils/forum-store.js")

Page({
  data: {
    user: {
      nickname: "校园用户",
      avatar: "/images/avatar/default.png"
    },

    currentTab: "my",
    currentCategory: "全部",
    keyword: "",

    myViewCount: 0,
    myLikeReceivedCount: 0,
    myCollectReceivedCount: 0,

    timeRangeIndex: 0,
    sortIndex: 0,
    timeRangeList: [],
    sortList: [],
    timeRangeNames: [],
    sortNames: [],

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
    this.initSortOptions()
  },

  onShow() {
    this.loadData()
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

    this.updateShowList()
  },

  // 修改排序条件
  onSortChange(event) {
    this.setData({
      sortIndex: Number(event.detail.value)
    })

    this.updateShowList()
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
    const posts = forumStore.getPosts()
    const myPostIds = forumStore.getMyPostIds()

    const myPostList = posts.filter(item => {
      return item.isMine || myPostIds.includes(item.postId)
    })

    const collectList = posts.filter(item => item.isCollected)

    const likeList = posts.filter(item => item.isLiked)

    // 统计“我发布的帖子”收到的数据
    let myViewCount = 0
    let myLikeReceivedCount = 0
    let myCollectReceivedCount = 0

    myPostList.forEach(item => {
      myViewCount += Number(item.view || 0)
      myLikeReceivedCount += Number(item.like || 0)
      myCollectReceivedCount += Number(item.collect || 0)
    })

    this.setData({
      posts: posts,
      myPostList: myPostList,
      collectList: collectList,
      likeList: likeList,
      myViewCount: myViewCount,
      myLikeReceivedCount: myLikeReceivedCount,
      myCollectReceivedCount: myCollectReceivedCount
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

  // 根据 tab、分类、搜索词、时间、排序更新展示列表
  updateShowList() {
    const {
      currentTab,
      currentCategory,
      keyword,
      timeRangeIndex,
      sortIndex,
      timeRangeList,
      sortList,
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
      emptyText = "还没有发布过帖子"
    }

    if (currentTab === "collect") {
      baseList = collectList
      tabTitle = "我的收藏"
      emptyText = "还没有收藏帖子"
    }

    if (currentTab === "like") {
      baseList = likeList
      tabTitle = "我的点赞"
      emptyText = "还没有点赞帖子"
    }

    const timeRange = timeRangeList[timeRangeIndex]
      ? timeRangeList[timeRangeIndex].value
      : "all"

    const sortType = sortList[sortIndex]
      ? sortList[sortIndex].value
      : "heat"

    const result = postFilter.filterAndSortPosts(baseList, {
      category: currentCategory,
      keyword: keyword,
      timeRange: timeRange,
      sortType: sortType
    })

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
