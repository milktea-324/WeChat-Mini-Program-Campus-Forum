const forumData = require("../../data/forum-data.js")
const postFilter = require("../../utils/post-filter.js")
const forumStore = require("../../utils/forum-store.js")
const profileService = require("../../utils/profile-service.js")
const postService = require("../../utils/post-service.js")
const profileNav = require("../../utils/profile-nav.js")
const routeNav = require("../../utils/route-nav.js")

function isSamePostId(left, right) {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber === rightNumber
  }

  return String(left) === String(right)
}

function isMyPost(post, myPostIds) {
  const list = Array.isArray(myPostIds) ? myPostIds : []

  return Boolean(post && post.isMine) ||
    list.some(postId => isSamePostId(post && post.postId, postId))
}

function buildPostCardViews(posts, context) {
  const list = Array.isArray(posts) ? posts : []
  const safeContext = context || {}
  const currentUser = safeContext.currentUser || null
  const baseUsers = Array.isArray(safeContext.users)
    ? safeContext.users
    : currentUser
      ? [currentUser]
      : []
  const users = currentUser && currentUser.userId !== "current-user"
    ? baseUsers.concat([Object.assign({}, currentUser, { userId: "current-user" })])
    : baseUsers

  return list
    .map(post => postService.buildPostCardView(post, {
      users: users,
      categories: forumData.categoryList,
      currentUser: currentUser
    }))
    .filter(item => Boolean(item))
}

Page({
  data: {
    user: {
      nickname: "校园用户",
      avatar: "/images/avatar/default.png"
    },

    currentTab: "published",
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
    myCommentList: [],
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
    const profileView = profileService.getMineProfileView({
      posts: posts,
      myPostIds: myPostIds
    })
    const profileStats = profileView.stats || {}
    const profileLists = profileView.lists || {}
    const user = profileView.user || this.data.user

    const myPostList = posts.filter(item => {
      return isMyPost(item, myPostIds)
    })

    const collectList = posts.filter(item => item.isCollected)

    const likeList = posts.filter(item => item.isLiked)

    this.setData({
      user: user,
      posts: posts,
      myPostList: myPostList,
      collectList: collectList,
      likeList: likeList,
      myCommentList: profileLists.myComments || [],
      myViewCount: profileStats.receivedViewCount || 0,
      myLikeReceivedCount: profileStats.receivedLikeCount || 0,
      myCollectReceivedCount: profileStats.receivedCollectCount || 0
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

    if (currentTab === "comments") {
      this.setData({
        showList: [],
        tabTitle: "我的评论",
        emptyText: "还没有发表过评论"
      })
      return
    }

    if (currentTab === "published") {
      baseList = myPostList
      tabTitle = "我的发布"
      emptyText = "还没有发布过帖子"
    }

    if (currentTab === "collected") {
      baseList = collectList
      tabTitle = "我的收藏"
      emptyText = "还没有收藏帖子"
    }

    if (currentTab === "liked") {
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
    const showList = buildPostCardViews(result, {
      currentUser: this.data.user
    })

    if (baseList.length > 0 && result.length === 0) {
      emptyText = "当前筛选条件下没有帖子"
    }

    this.setData({
      showList: showList,
      tabTitle: tabTitle,
      emptyText: emptyText
    })
  },

  // 点击帖子进入详情页
  onTapPost(event) {
    const postId = event.currentTarget.dataset.postId

    routeNav.goPostDetail(postId)
  },

  onTapComment(event) {
    const postId = event.currentTarget.dataset.postId
    const available = event.currentTarget.dataset.available === true ||
      event.currentTarget.dataset.available === "true"

    if (!available) {
      wx.showToast({
        title: "原帖已不可用",
        icon: "none"
      })
      return
    }

    routeNav.goPostDetail(postId)
  },

  // 点击作者头像进入作者主页
  onTapAuthor(event) {
    const dataset = event.currentTarget.dataset

    profileNav.goUserProfile({
      userId: dataset.authorId,
      nickname: dataset.authorName,
      avatar: dataset.avatar
    })
  }
})
