const router = require('express').Router({ mergeParams: true });
const User = require('../models/user');
const WallPost = require('../models/post');
const CommentPost = require('../models/comments');
require('dotenv/config');
const verifySession = require('../verifytoken/verifytoken');

router.get('/:id', async (req, res) => {
  const finded = await User.findOne({ uid: req.params.id });

  User.findOne({ uid: req.params.id })
    .populate({
      path: 'posts',
      populate: { path: 'comments' },
    })
    .exec(function (err, data) {
      if (err) throw err;
      const result = data.posts;
      const idsWithNamesFromPosts = [];
      const idsWithNamesFromComments = [];
      const correctPosts = [];
      let ArrayOfComments = [];
      const findedUsers = [];
      const findedComments = [];
      const allIdsFromPosts = [];
      const allIdsFromComments = [];
      // eslint-disable-next-line array-callback-return
      result.map((post) => {
        findedComments.push(post.comments);
        allIdsFromPosts.push(post.from);
        if (post.comments.length !== 0) {
          post.comments.map((commentsEl) => {
            return allIdsFromComments.push(commentsEl.from);
          });
        }
      });
      const arrayOfIdsWithoutDuplicatesFromComments = Array.from(
        new Set(allIdsFromComments),
      );
      const arrayOfIdsWithoutDuplicatesFromPosts = Array.from(
        new Set(allIdsFromPosts),
      );
      const allIds = arrayOfIdsWithoutDuplicatesFromPosts.concat(
        arrayOfIdsWithoutDuplicatesFromComments,
      );
      const allIdsWithoutDup = Array.from(new Set(allIds));
      Promise.all(
        allIdsWithoutDup.map(async (el) => {
          findedUsers.push(await User.findOne({ uid: el }));
        }),
      ).then(() => {
        for (let i = 0; i < findedUsers.length; i += 1) {
          for (
            let j = 0;
            j < arrayOfIdsWithoutDuplicatesFromPosts.length;
            j += 1
          ) {
            if (
              findedUsers[i].uid ===
              arrayOfIdsWithoutDuplicatesFromPosts[j]
            ) {
              idsWithNamesFromPosts.push({
                name: findedUsers[i].name,
                nickname: findedUsers[i].nickname,
                surname: findedUsers[i].surname,
                idForSearch: arrayOfIdsWithoutDuplicatesFromPosts[j],
              });
            }
          }
          for (
            let j = 0;
            j < arrayOfIdsWithoutDuplicatesFromComments.length;
            j += 1
          ) {
            if (
              findedUsers[i].uid ===
              arrayOfIdsWithoutDuplicatesFromComments[j]
            ) {
              idsWithNamesFromComments.push({
                name: findedUsers[i].name,
                nickname: findedUsers[i].nickname,
                surname: findedUsers[i].surname,
                idForSearch:
                  arrayOfIdsWithoutDuplicatesFromComments[j],
              });
            }
          }
        }

        const CommentsArrayWithNames = [];
        let CommentsWithNames = [];
        const clearArrayComments = [];

        for (let i = 0; i < findedComments.length; i++) {
          if (findedComments[i].length !== 0) {
            findedComments[i].map((el) => {
              ArrayOfComments.push({
                commentId: el.commentId,
                likes: el.likes,
                textComment: el.textComment,
                from: el.from,
                whenTime: el.whenTime,
              });
            });
            clearArrayComments.push(ArrayOfComments);
            ArrayOfComments = [];
          } else if (findedComments[i].length === 0) {
            clearArrayComments.push([]);
            ArrayOfComments = [];
          }
        }

        for (let i = 0; i < idsWithNamesFromComments.length; i += 1) {
          for (let j = 0; j < clearArrayComments.length; j += 1) {
            if (clearArrayComments[j].length !== 0) {
              CommentsWithNames = [];
              clearArrayComments[j].map((el) => {
                if (
                  el.from === idsWithNamesFromComments[i].idForSearch
                ) {
                  CommentsWithNames.push({
                    ...el,
                    ...idsWithNamesFromComments[i],
                  });
                }
              });
              CommentsArrayWithNames.push(CommentsWithNames);
            } else if (clearArrayComments[j].length === 0) {
              CommentsArrayWithNames.push([]);
            }
          }
        }
        for (let i = 0; i < result.length; i += 1) {
          correctPosts.push({
            postId: result[i].postId,
            likes: result[i].likes,
            comments: CommentsArrayWithNames[i],
            from: result[i].from,
            whenTime: result[i].whenTime,
            text: result[i].text,
          });
        }
        const finalArray = [];
        for (let i = 0; i < idsWithNamesFromPosts.length; i += 1) {
          for (let j = 0; j < correctPosts.length; j += 1) {
            if (
              idsWithNamesFromPosts[i].idForSearch ===
              correctPosts[j].from
            ) {
              finalArray.push({
                ...correctPosts[j],
                ...idsWithNamesFromPosts[i],
              });
            }
          }
        }

        finalArray.sort(function (a, b) {
          return a.postId - b.postId;
        });
        res.status(200).send({
          apiData: {
            id: finded.uid,
            email: finded.email,
            name: finded.name,
            surname: finded.surname,
            nickname: finded.nickname,
            posts: finalArray,
          },
          resultCode: 0,
        });
      });
    });
});

router.put('/status', async (req, res) => {
  const { status, timeCreation } = await req.body;
  const finded = await User.findOneAndUpdate(
    { uid: req.session.userId },
    {
      status: {
        statusText: status,
        timeCreation,
      },
    },
    {
      new: true,
    },
  );

  res.status(200).send('ok');
});

router.post('/status', async (req, res) => {
  const finded = await User.findOne({ uid: req.body.userId });
  res
    .status(200)
    .send({ apiData: { status: finded.status }, resultCode: 0 });
});

router.post('/status/time', async (req, res) => {
  const finded = await User.findOne({ uid: req.body.userId });
  res.status(200).send({
    apiData: { statusTime: finded.status.timeCreation },
    resultCode: 0,
  });
});

router.put('/api/newpost', verifySession, async (req, res) => {
  const finded = await User.findOne({ uid: req.session.userId });

  const newPost = new WallPost({
    from: req.session.userId,
    whenTime: req.body.whenTime,
    text: req.body.text,
  });

  await newPost.save();
  User.findOneAndUpdate(
    { uid: req.body.whoseWall },
    { $push: { posts: newPost._id } },
    { new: true },
    (error, data) => {
      if (error) {
        console.log(error);
      } else {
        User.findOne({ uid: req.body.whoseWall })
          .populate('posts')
          .exec(function (err, data) {
            if (err) throw err;

            const result = data.posts;
            const lengthArrayPostId = data.posts.length - 1;
            const correctArray = [];
            correctArray.push({
              postId: result[lengthArrayPostId].postId,
              likes: result[lengthArrayPostId].likes,
              comments: result[lengthArrayPostId].comments,
              from: result[lengthArrayPostId].from,
              whenTime: result[lengthArrayPostId].whenTime,
              text: result[lengthArrayPostId].text,
            });
            const idsWithNamesFromPosts = [];
            idsWithNamesFromPosts.push({
              name: finded.name,
              nickname: finded.nickname,
              surname: finded.surname,
            });
            const finalArray = [];
            finalArray.push({
              ...correctArray[0],
              ...idsWithNamesFromPosts[0],
            });
            res.status(200).send({
              apiData: {
                postedPost: finalArray[0],
              },
              resultCode: 0,
            });
          });
      }
    },
  );
});

router.post('/api/liketogle', verifySession, async (req, res) => {
  const idFinded = req.session.userId;
  const findedPost = WallPost.find({
    postId: req.body.postId,
    likes: { $in: [req.session.userId] },
  }).exec(function (err, results) {
    if (err) {
      res.send(err);
    }
    if (results.length !== 0) {
      WallPost.findOneAndUpdate(
        { postId: req.body.postId },
        {
          $pull: { likes: req.session.userId },
        },
        {
          new: true,
        },
      ).exec(function (err3, results3) {
        if (err3) {
          console.log(err3);
        }
        res.send({
          apiData: { likes: results3.likes, postId: results3.postId },
        });
      });
    } else if (results.length === 0) {
      WallPost.findOneAndUpdate(
        { postId: req.body.postId },
        {
          $addToSet: { likes: req.session.userId },
        },
        {
          new: true,
        },
      ).exec(function (err3, results3) {
        if (err3) {
          console.log(err3);
        }
        res.send({
          apiData: {
            likes: results3.likes !== null ? results3.likes : [],
            postId: results3.postId,
          },
        });
      });
    }
  });
});

router.post(
  '/api/comment/liketogle',
  verifySession,
  async (req, res) => {
    CommentPost.find({
      commentId: req.body.commentId,
      likes: { $in: [req.session.userId] },
    }).exec(function (err, results) {
      if (err) {
        res.send(err);
      }
      if (results.length !== 0) {
        CommentPost.findOneAndUpdate(
          { commentId: req.body.commentId },
          {
            $pull: { likes: req.session.userId },
          },
          {
            new: true,
          },
        ).exec(function (err3, results3) {
          if (err3) {
            console.log(err3);
          }
          res.send({
            apiData: {
              likes: results3.likes,
              commentId: results3.commentId,
            },
          });
        });
      } else if (results.length === 0) {
        CommentPost.findOneAndUpdate(
          { commentId: req.body.commentId },
          {
            $addToSet: { likes: req.session.userId },
          },
          {
            new: true,
          },
        ).exec(function (err3, results3) {
          if (err3) {
            console.log(err3);
          }
          res.send({
            apiData: {
              likes: results3.likes !== null ? results3.likes : [],
              commentId: results3.commentId,
            },
          });
        });
      }
    });
  },
);

router.post('/api/like', verifySession, async (req, res) => {
  WallPost.findOneAndUpdate(
    { postId: req.body.postId },
    {
      $addToSet: { likes: req.session.userId },
    },
    {
      new: true,
    },
  ).exec(function (err3, results3) {
    if (err3) {
      console.log(err3);
    }
    res.send({ 'you liked post with id': req.body.postId });
  });
});

router.post('/api/unlike', verifySession, async (req, res) => {
  WallPost.findOneAndUpdate(
    { postId: req.body.postId },
    {
      $pull: { likes: req.session.userId },
    },
    {
      new: true,
    },
  ).exec(function (err3, results3) {
    if (err3) {
      console.log(err3);
    }
    res.send({ 'you unliked post with id': req.body.postId });
  });
});

router.put('/api/newcomment', verifySession, async (req, res) => {
  const finded = await User.findOne({ uid: req.session.userId });

  const newComment = new CommentPost({
    from: req.session.userId,
    whenTime: req.body.whenTime,
    textComment: req.body.textComment,
  });

  await newComment.save();
  WallPost.findOneAndUpdate(
    { postId: req.body.postId },
    { $push: { comments: newComment._id } },
    { new: true },
    (error, data) => {
      if (error) {
        console.log(error);
      } else {
        WallPost.findOne({ postId: req.body.postId })
          .populate('comments')
          .exec(function (err, data) {
            if (err) throw err;

            const result = data.comments;
            const lengthArrayPostId = data.comments.length - 1;
            const correctArray = [];
            correctArray.push({
              from: result[lengthArrayPostId].from,
              commentId: result[lengthArrayPostId].commentId,
              whenTime: result[lengthArrayPostId].whenTime,
              textComment: result[lengthArrayPostId].textComment,
              likes: result[lengthArrayPostId].likes,
            });
            const idsWithNamesFromPosts = [];
            idsWithNamesFromPosts.push({
              name: finded.name,
              nickname: finded.nickname,
              surname: finded.surname,
            });
            const finalArray = [];
            finalArray.push({
              ...correctArray[0],
              ...idsWithNamesFromPosts[0],
            });
            res.status(200).send({
              apiData: {
                postedComment: finalArray[0],
              },
              resultCode: 0,
            });
          });
      }
    },
  );
});

router.put('/api/deletecomment', verifySession, async (req, res) => {
  await CommentPost.findOne({
    commentId: req.body.commentId,
  }).exec(function (err, commentPostData) {
    if (err) throw err;
    if (commentPostData.from === req.session.userId) {
      WallPost.findOneAndUpdate(
        { comments: { $in: [commentPostData._id] } },
        {
          $pull: { comments: commentPostData._id },
        },
        {
          new: false,
        },
      ).exec(function (err2, wallPostData) {
        if (err2) throw err2;
        CommentPost.findByIdAndDelete(
          commentPostData._id,
          function (errDel, deleted) {
            if (errDel) throw errDel;
            res.send({ deletedComment: deleted });
          },
        );
      });
    } else if (commentPostData.from !== req.session.userId) {
      res.send('Its not your comment!');
    }
  });
});

router.put('/test', verifySession, async (req, res) => {
  //  del comment

  // await CommentPost.findOne({
  //   uid: req.body.commentId,
  // }).exec(function (err, commentPostData) {
  //   if (err) throw err;
  //   WallPost.findOne({
  //     comments: { $in: [commentPostData._id] },
  //   }).exec(function (err2, wallPostData) {
  //     if (err2) throw err;
  //     User.findOne({
  //       posts: { $in: [wallPostData._id] },
  //     }).exec(function (err3, userData) {
  //       if (err3) throw err;
  //       res.send({ userData2: userData });
  //     });
  //   });
  // });

  await CommentPost.findOne({
    commentId: req.body.commentId,
  }).exec(function (err, commentPostData) {
    if (err) throw err;
    if (commentPostData.from === req.session.userId) {
      WallPost.findOneAndUpdate(
        { comments: { $in: [commentPostData._id] } },
        {
          $pull: { comments: commentPostData._id },
        },
        {
          new: false,
        },
      ).exec(function (err2, wallPostData) {
        if (err2) throw err2;
        CommentPost.findByIdAndDelete(
          commentPostData._id,
          function (errDel, deleted) {
            if (errDel) throw errDel;
            res.send({ deletedComment: deleted });
          },
        );
      });
    } else if (commentPostData.from !== req.session.userId) {
      res.send('Its not your comment!');
    }
  });

  // await CommentPost.findOne({
  //   commentId: req.body.commentId,
  // }).exec(function (err, commentPostData) {
  //   if (err) throw err;
  //   if (commentPostData.from === req.session.userId) {
  //     WallPost.findOne({
  //       comments: { $in: [commentPostData._id] },
  //     }).exec(function (err2, wallPostData) {
  //       if (err2) throw err2;
  //       CommentPost.findByIdAndDelete(
  //         commentPostData._id,
  //         function (errDel, deleted) {
  //           if (errDel) throw errDel;
  //           res.send({ deletedComment: deleted });
  //         },
  //       );
  //     });
  //   } else if (commentPostData.from !== req.session.userId) {
  //     res.send('Its not your comment!');
  //   }
  // });
});

module.exports = router;
