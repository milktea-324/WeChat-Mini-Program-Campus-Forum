const swiperList = [
  {
    id: 1,
    imgSrc: "/images/post/bl.png"
  },
  {
    id: 2,
    imgSrc: "/images/post/cat.png"
  },
  {
    id: 3,
    imgSrc: "/images/post/vr.png"
  }
]

const categoryList = [
  { id: 0, name: "全部" },
  { id: 1, name: "学习交流" },
  { id: 2, name: "校园生活" },
  { id: 3, name: "失物招领" },
  { id: 4, name: "二手交易" },
  { id: 5, name: "社团活动" },
  { id: 6, name: "考试资料" }
]

const postList = [
  {
    postId: 1,
    title: "期末 Java 复习应该看哪些重点？",
    content: "最近在复习 Java，感觉集合、异常、IO、面向对象这些内容比较多，想问问大家复习顺序。",
    category: "学习交流",
    author: "小林",
    avatar: "/images/avatar/1.png",
    postImg: "/images/post/bl.png",
    date: "2026-06-18",
    view: 128,
    like: 12,
    collect: 7,
    commentCount: 3,
    isCollected: false
  },
  {
    postId: 2,
    title: "图书馆三楼有人捡到校园卡吗？",
    content: "今天下午在图书馆三楼自习，可能把校园卡落在座位附近了。",
    category: "失物招领",
    author: "木子",
    avatar: "/images/avatar/2.png",
    postImg: "/images/post/cat.png",
    date: "2026-06-19",
    view: 89,
    like: 5,
    collect: 4,
    commentCount: 1,
    isCollected: false
  },
  {
    postId: 3,
    title: "出一本八成新的高等数学教材",
    content: "高数教材上学期用过，书页完整，没有缺页，有少量笔记，需要的同学可以联系。",
    category: "二手交易",
    author: "阿明",
    avatar: "/images/avatar/3.png",
    postImg: "/images/post/xiaolong.jpg",
    date: "2026-06-20",
    view: 76,
    like: 8,
    collect: 4,
    commentCount: 2,
    isCollected: false
  },
  {
    postId: 4,
    title: "有没有同学想一起参加社团活动？",
    content: "这周社团有一次线下活动，主要是交流学习经验和项目展示，感兴趣的同学可以一起去。",
    category: "社团活动",
    author: "七月",
    avatar: "/images/avatar/4.png",
    postImg: "/images/post/crab.png",
    date: "2026-06-21",
    view: 142,
    like: 15,
    commentCount: 6,
    isCollected: false
  },
  {
    postId: 5,
    title: "英语四级备考资料分享",
    content: "整理了一些四级词汇、听力和阅读资料，适合期末之后继续准备考试的同学参考。",
    category: "考试资料",
    author: "南风",
    avatar: "/images/avatar/5.png",
    postImg: "/images/post/sls.JPG",
    date: "2026-06-22",
    view: 203,
    like: 26,
    collect: 46,
    commentCount: 9,
    isCollected: false
  }
]

module.exports = {
  swiperList,
  categoryList,
  postList
}