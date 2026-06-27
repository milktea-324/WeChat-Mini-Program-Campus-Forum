const assert = require("assert")
const path = require("path")

const validatorPath = path.join(__dirname, "..", "..", "\u6821\u56ed\u8bba\u575b", "utils", "forum-data-validator.js")
const { validateForumData } = require(validatorPath)

const CATEGORY_ALL = "\u5168\u90e8"
const CATEGORY_STUDY = "\u5b66\u4e60\u4ea4\u6d41"

function createSnapshot(overrides) {
  return Object.assign({
    posts: [
      {
        postId: "post-1",
        title: "post one",
        authorId: "user-1",
        author: "User One",
        avatar: "/images/avatar/1.png",
        category: CATEGORY_STUDY,
        postImg: "/images/post/cover.png",
        commentCount: 1
      }
    ],
    comments: [
      {
        commentId: "comment-1",
        postId: "post-1",
        authorId: "user-2",
        content: "comment one",
        parentCommentId: null,
        rootCommentId: null,
        level: 1,
        status: "active"
      }
    ],
    users: [
      { userId: "user-1", nickname: "User One" },
      { userId: "user-2", nickname: "User Two" }
    ],
    currentUser: { userId: "user-1" },
    categories: [
      { id: 0, name: CATEGORY_ALL },
      { id: 1, name: CATEGORY_STUDY }
    ],
    myPostIds: ["post-1"]
  }, overrides || {})
}

function hasIssue(list, code, targetId) {
  return list.some(issue => {
    if (issue.code !== code) {
      return false
    }

    if (targetId === undefined) {
      return true
    }

    return issue.targetId === targetId
  })
}

let result = validateForumData(createSnapshot())

assert.strictEqual(result.errors.length, 0)
assert.ok(Array.isArray(result.warnings))
assert.ok(Array.isArray(result.infos))
assert.ok(hasIssue(result.infos, "SUMMARY_POST_COUNT"))
assert.ok(hasIssue(result.infos, "CATEGORY_ALL_FILTER_COMPAT"))

result = validateForumData(createSnapshot({
  posts: [
    {
      postId: "post-1",
      authorId: "user-1",
      category: CATEGORY_STUDY,
      commentCount: 0
    },
    {
      postId: "post-1",
      authorId: "user-2",
      category: CATEGORY_STUDY,
      commentCount: 0
    }
  ],
  comments: [],
  myPostIds: []
}))

assert.ok(hasIssue(result.errors, "DUPLICATE_POST_ID", "post-1"))

result = validateForumData(createSnapshot({
  posts: [
    {
      postId: "post-1",
      authorId: "missing-user",
      category: CATEGORY_STUDY,
      commentCount: 1
    }
  ]
}))

assert.ok(hasIssue(result.errors, "POST_AUTHOR_NOT_FOUND", "post-1"))

result = validateForumData(createSnapshot({
  comments: [
    {
      commentId: "comment-1",
      postId: "missing-post",
      authorId: "user-2",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "active"
    }
  ]
}))

assert.ok(hasIssue(result.errors, "COMMENT_POST_NOT_FOUND", "comment-1"))

result = validateForumData(createSnapshot({
  comments: [
    {
      commentId: "comment-1",
      postId: "post-1",
      authorId: "missing-user",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "active"
    }
  ]
}))

assert.ok(hasIssue(result.errors, "COMMENT_AUTHOR_NOT_FOUND", "comment-1"))

result = validateForumData(createSnapshot({
  myPostIds: ["missing-post"]
}))

assert.ok(hasIssue(result.warnings, "MY_POST_NOT_FOUND", "missing-post"))

result = validateForumData(createSnapshot({
  posts: [
    {
      postId: "post-1",
      authorId: "user-1",
      category: CATEGORY_ALL,
      commentCount: 1
    }
  ]
}))

assert.ok(hasIssue(result.errors, "POST_CATEGORY_ALL_INVALID", "post-1"))

result = validateForumData(createSnapshot({
  posts: [
    {
      postId: "post-1",
      authorId: "user-1",
      category: CATEGORY_STUDY,
      commentCount: 2
    }
  ]
}))

assert.ok(hasIssue(result.warnings, "POST_COMMENT_COUNT_MISMATCH", "post-1"))

result = validateForumData(createSnapshot({
  comments: [
    {
      commentId: "comment-1",
      postId: "post-1",
      authorId: "user-2",
      parentCommentId: null,
      rootCommentId: null,
      level: 1,
      status: "active"
    }
  ]
}))

assert.strictEqual(result.errors.length, 0)
assert.ok(hasIssue(result.warnings, "LEVEL_ONE_COMMENT_ROOT_MISSING", "comment-1"))

result = validateForumData(createSnapshot({
  comments: [
    {
      commentId: "reply-1",
      postId: "post-1",
      authorId: "user-2",
      parentCommentId: "missing-comment",
      rootCommentId: "comment-1",
      level: 2,
      status: "active"
    }
  ]
}))

assert.ok(hasIssue(result.errors, "COMMENT_PARENT_NOT_FOUND", "reply-1"))

console.log("forum-data-validator tests passed")
