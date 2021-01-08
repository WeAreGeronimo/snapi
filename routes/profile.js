const router = require('express').Router({ mergeParams: true });
const User = require('../models/user');
const WallPost = require('../models/post');
const CommentPost = require('../models/comments');
require('dotenv/config');
const verifySession = require('../verifytoken/verifytoken');

router.get('/:id', async (req, res) => {
  const finded = await User.findOne({ uid: req.params.id });

  await User.findOne({ uid: req.params.id })
    .populate({
      path: 'posts',
      populate: { path: 'comments' },
    })
    .exec(function (err, data) {
      if (err) throw err;
      const realCountOfComments = [];
      const result = data.posts.slice(-5);
      result.map((post) => {
        return realCountOfComments.push({
          postId: post.postId,
          commentsCount: post.comments.length,
        });
      });
      const idsWithNamesFromPosts = [];
      const idsWithNamesFromComments = [];
      const correctPosts = [];
      const findedUsers = [];
      const allIdsFromPosts = [];
      const allIdsFromComments = [];
      const assocFindedComments = new Map();
      const finalArray = [];
      // eslint-disable-next-line array-callback-return
      result.map((post) => {
        assocFindedComments.set(post.postId, post.comments.slice(-3));
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
        findedUsers.sort(function (a, b) {
          return b.uid - a.uid;
        });
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

        const assocClearArrayComments = new Map();
        const assocClearArrayCommentsWithNames = new Map();
        let arrHandler = [];
        let arrHandler2 = [];
        assocFindedComments.forEach(function (comments, postId) {
          for (let p = 0; p < comments.length; p += 1) {
            arrHandler.push({
              commentId: comments[p].commentId,
              likes: comments[p].likes,
              from: comments[p].from,
              whenTime: comments[p].whenTime,
              textComment: comments[p].textComment,
            });
          }
          assocClearArrayComments.set(postId, arrHandler);
          arrHandler = [];
        });

        assocClearArrayComments.forEach(function (comment, postId) {
          idsWithNamesFromComments.map((ComWithNames) => {
            comment.map((commentEl) => {
              if (ComWithNames.idForSearch === commentEl.from) {
                arrHandler2.push({ ...commentEl, ...ComWithNames });
              }
              return arrHandler2;
            });
            return arrHandler2;
          });
          assocClearArrayCommentsWithNames.set(postId, arrHandler2);
          arrHandler2 = [];
        });

        for (let i = 0; i < result.length; i += 1) {
          correctPosts.push({
            postId: result[i].postId,
            likes: result[i].likes,
            from: result[i].from,
            whenTime: result[i].whenTime,
            text: result[i].text,
            commentsCountInApi: realCountOfComments[i].commentsCount,
          });
        }

        assocClearArrayCommentsWithNames.forEach(function (
          comment,
          postId,
        ) {
          correctPosts.map((post) => {
            if (post.postId === postId) {
              post.comments = comment;
            }
            return post;
          });
        });

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
            postsLength: data.posts.length,
          },
          resultCode: 0,
        });
      });
    });
});

router.post('/api/nextwallposts', async (req, res) => {
  User.findOne({ uid: req.body.userId })
    .populate({
      path: 'posts',
      populate: { path: 'comments' },
    })
    .exec(function (err, data) {
      if (err) throw err;
      let initialSlice = 0;
      let endSlice = 0;
      if (data.posts.length < 10) {
        endSlice = data.posts.length - 5;
        initialSlice = 0;
      } else {
        initialSlice = data.posts.length - 10;
        endSlice = data.posts.length - 5;
      }
      const decr = () => {
        if (initialSlice < 5) {
          endSlice = initialSlice;
          initialSlice = 0;
        } else if (initialSlice >= 5) {
          if (initialSlice <= 5) {
            initialSlice -= initialSlice;
          } else if (initialSlice > 5) {
            initialSlice -= 5;
          }

          if (endSlice <= 10) {
            endSlice -= endSlice;
          } else if (endSlice > 10) {
            endSlice -= 5;
          }
        }
      };
      const a = req.body.nPost;
      let h = 0;
      for (let i = 0; i < a; i += 1) {
        decr();
        h += 1;
      }
      const realCountOfComments = [];
      const result = data.posts.slice(initialSlice, endSlice);
      result.map((post) => {
        realCountOfComments.push({
          postId: post.postId,
          commentsCount: post.comments.length,
        });
        return realCountOfComments;
      });
      const idsWithNamesFromPosts = [];
      const idsWithNamesFromComments = [];
      const correctPosts = [];
      const findedUsers = [];
      const allIdsFromPosts = [];
      const allIdsFromComments = [];
      const assocFindedComments = new Map();
      // eslint-disable-next-line array-callback-return
      result.map((post) => {
        assocFindedComments.set(post.postId, post.comments.slice(-3));
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

        const assocClearArrayComments = new Map();
        const assocClearArrayCommentsWithNames = new Map();
        let arrHandler = [];
        let arrHandler2 = [];
        assocFindedComments.forEach(function (comments, postId) {
          for (let p = 0; p < comments.length; p += 1) {
            arrHandler.push({
              commentId: comments[p].commentId,
              likes: comments[p].likes,
              from: comments[p].from,
              whenTime: comments[p].whenTime,
              textComment: comments[p].textComment,
            });
          }
          assocClearArrayComments.set(postId, arrHandler);
          arrHandler = [];
        });

        assocClearArrayComments.forEach(function (comment, postId) {
          idsWithNamesFromComments.map((ComWithNames) => {
            comment.map((commentEl) => {
              if (ComWithNames.idForSearch === commentEl.from) {
                arrHandler2.push({ ...commentEl, ...ComWithNames });
              }
              return arrHandler2;
            });
            return arrHandler2;
          });
          assocClearArrayCommentsWithNames.set(postId, arrHandler2);
          arrHandler2 = [];
        });

        for (let i = 0; i < result.length; i += 1) {
          correctPosts.push({
            postId: result[i].postId,
            likes: result[i].likes,
            from: result[i].from,
            whenTime: result[i].whenTime,
            text: result[i].text,
            commentsCountInApi: realCountOfComments[i].commentsCount,
          });
        }

        assocClearArrayCommentsWithNames.forEach(function (
          comment,
          postId,
        ) {
          correctPosts.map((post) => {
            if (post.postId === postId) {
              post.comments = comment;
            }
            return post;
          });
        });

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

        finalArray.sort(function (c, d) {
          return c.postId - d.postId;
        });
        res.status(200).send({
          apiData: {
            posts: finalArray,
            postsLength: data.posts.length,
          },
          resultCode: 0,
        });
      });
    });
});

router.post('/api/nextcomments', async (req, res) => {
  WallPost.findOne({ postId: req.body.postId })
    .populate('comments')
    .exec(function (err, wallPostFinded) {
      if (err) throw err;
      const arrayOfComments = [];
      wallPostFinded.comments.map((comment) => {
        arrayOfComments.push({
          commentId: comment.commentId,
          likes: comment.likes,
          from: comment.from,
          whenTime: comment.whenTime,
          textComment: comment.textComment,
          postId: wallPostFinded.postId,
        });
        return arrayOfComments;
      });

      let initialSlice = 0;
      let endSlice = 0;
      if (arrayOfComments.length < 6) {
        endSlice = arrayOfComments.length - 3;
        initialSlice = 0;
      } else {
        initialSlice = arrayOfComments.length - 6;
        endSlice = arrayOfComments.length - 3;
      }
      const decr = () => {
        if (initialSlice < 3) {
          endSlice = initialSlice;
          initialSlice = 0;
        } else if (initialSlice >= 3) {
          if (initialSlice <= 3) {
            initialSlice -= initialSlice;
          } else if (initialSlice > 3) {
            initialSlice -= 3;
          }

          if (endSlice < 6) {
            endSlice -= endSlice;
          } else if (endSlice >= 6) {
            endSlice -= 3;
          }
        }
      };
      const a = req.body.nComments;
      let h = 0;
      for (let i = 0; i < a; i += 1) {
        decr();
        h += 1;
      }

      const result = arrayOfComments.slice(initialSlice, endSlice);
      const allIdsFromComments = [];
      const findedUsers = [];
      const ArrayOfComments = [];
      const idsWithNamesFromComments = [];
      if (arrayOfComments.length !== 0) {
        result.map((com) => {
          ArrayOfComments.push({
            commentId: com.commentId,
            likes: com.likes,
            textComment: com.textComment,
            from: com.from,
            whenTime: com.whenTime,
            postId: com.postId,
          });
          return allIdsFromComments.push(com.from);
        });
      }
      const arrayOfIdsWithoutDuplicatesFromComments = Array.from(
        new Set(allIdsFromComments),
      );
      Promise.all(
        arrayOfIdsWithoutDuplicatesFromComments.map(async (el) => {
          findedUsers.push(await User.findOne({ uid: el }));
        }),
      ).then(() => {
        for (let i = 0; i < findedUsers.length; i += 1) {
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

        const finalArray = [];
        for (let i = 0; i < idsWithNamesFromComments.length; i += 1) {
          for (let j = 0; j < ArrayOfComments.length; j += 1) {
            if (
              idsWithNamesFromComments[i].idForSearch ===
              ArrayOfComments[j].from
            ) {
              finalArray.push({
                ...ArrayOfComments[j],
                ...idsWithNamesFromComments[i],
              });
            }
          }
        }
        res.send({ apiData: { comments: finalArray } });
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
              commentsCountInApi:
                result[lengthArrayPostId].comments.length,
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
            const realCountInApi = data.comments.length;
            const lengthArrayPostId = data.comments.length - 1;
            const correctArray = [];
            correctArray.push({
              from: result[lengthArrayPostId].from,
              commentId: result[lengthArrayPostId].commentId,
              whenTime: result[lengthArrayPostId].whenTime,
              textComment: result[lengthArrayPostId].textComment,
              likes: result[lengthArrayPostId].likes,
              postId: req.body.postId,
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
                commentsCountInApi: realCountInApi,
                comments: finalArray[0],
              },
              resultCode: 0,
            });
          });
      }
    },
  );
});

router.post('/api/deletecomment', verifySession, async (req, res) => {
  CommentPost.countDocuments(
    { commentId: req.body.commentId },
    function (errCheck, count) {
      if (errCheck) console.log(errCheck);
      if (count > 0) {
        CommentPost.findOne({
          commentId: req.body.commentId,
        }).exec(function (err, commentPostData) {
          if (err) throw err;
          WallPost.findOne({
            comments: { $in: [commentPostData._id] },
          }).exec(function (err2, wallPostData) {
            if (err2) throw err;
            User.findOne({
              posts: { $in: [wallPostData._id] },
            }).exec(function (err3, userData) {
              if (err3) throw err;
              if (userData.uid === req.session.userId) {
                WallPost.findOneAndUpdate(
                  { comments: { $in: [commentPostData._id] } },
                  {
                    $pull: { comments: commentPostData._id },
                  },
                  {
                    new: true,
                  },
                ).exec(function (err4, wallPostDataForDelete) {
                  if (err4) throw err4;
                  CommentPost.findByIdAndDelete(
                    commentPostData._id,
                    function (errDel, deleted) {
                      if (errDel) throw errDel;
                      res.send({
                        apiData: {
                          postId: wallPostDataForDelete.postId,
                          commentId: deleted.commentId,
                          commentsCountInApi:
                            wallPostDataForDelete.comments.length,
                        },
                        resultCode: 0,
                      });
                    },
                  );
                });
              } else if (userData.uid !== req.session.userId) {
                if (commentPostData.from === req.session.userId) {
                  WallPost.findOneAndUpdate(
                    { comments: { $in: [commentPostData._id] } },
                    {
                      $pull: { comments: commentPostData._id },
                    },
                    {
                      new: true,
                    },
                  ).exec(function (err5, wallPostDataDel) {
                    if (err5) throw err5;
                    CommentPost.findByIdAndDelete(
                      commentPostData._id,
                      function (errDel, deleted) {
                        if (errDel) throw errDel;
                        res.send({
                          apiData: {
                            postId: wallPostDataDel.postId,
                            commentId: deleted.commentId,
                            commentsCountInApi:
                              wallPostDataDel.comments.length,
                          },
                          resultCode: 0,
                        });
                      },
                    );
                  });
                } else if (
                  commentPostData.from !== req.session.userId
                ) {
                  res.send({
                    msg:
                      'Вы не можете удалять чужие комментарии не на своей стене!',
                  });
                }
              }
            });
          });
        });
      } else if (count === 0) {
        res.send(
          `Комментарий с commentId "${req.body.commentId}" не существует или уже удален.`,
        );
      }
    },
  );
});

router.post('/api/deletepost', verifySession, async (req, res) => {
  //  del post

  WallPost.countDocuments(
    { postId: req.body.postId },
    function (errCheck, count) {
      if (errCheck) throw errCheck;
      if (count > 0) {
        const arrOfIdsCommentsForDeleting = [];
        WallPost.findOne({ postId: req.body.postId }).exec(function (
          err,
          wallPostFinded,
        ) {
          if (err) throw err;
          if (req.session.userId === wallPostFinded.from) {
            wallPostFinded.comments.map((comment) => {
              arrOfIdsCommentsForDeleting.push(comment._id);
              return arrOfIdsCommentsForDeleting;
            });
            Promise.all(
              arrOfIdsCommentsForDeleting.map(async (el) => {
                CommentPost.findByIdAndDelete(
                  el,
                  function (errDel, deletedComments) {
                    if (errDel) throw errDel;
                  },
                );
              }),
            ).then(() => {
              WallPost.findByIdAndDelete(
                wallPostFinded._id,
                function (errDel, deletedPostFA2) {
                  if (errDel) throw errDel;
                  User.findOneAndUpdate(
                    { posts: { $in: [wallPostFinded._id] } },
                    {
                      $pull: { posts: wallPostFinded._id },
                    },
                    {
                      new: true,
                    },
                  ).exec(function (errUs, dataUser) {
                    if (errUs) throw errUs;
                    res.status(200).send({
                      apiData: {
                        deletedPost: deletedPostFA2,
                        postsLength: dataUser.posts.length,
                      },
                    });
                  });
                },
              );
            });
          } else if (req.session.userId !== wallPostFinded.from) {
            User.findOne({
              posts: { $in: [wallPostFinded._id] },
            }).exec(function (errU, findedUser) {
              if (errU) throw errU;
              if (findedUser.uid === req.session.userId) {
                wallPostFinded.comments.map((comment) => {
                  arrOfIdsCommentsForDeleting.push(comment._id);
                  return arrOfIdsCommentsForDeleting;
                });
                Promise.all(
                  arrOfIdsCommentsForDeleting.map(async (el) => {
                    CommentPost.findByIdAndDelete(
                      el,
                      function (errDel, deletedComments) {
                        if (errDel) throw errDel;
                      },
                    );
                  }),
                ).then(() => {
                  WallPost.findByIdAndDelete(
                    wallPostFinded._id,
                    function (errDel, deletedPostFA) {
                      if (errDel) throw errDel;
                      console.log(
                        'Удален свой пост или пост на своей стене.',
                      );
                      console.log(deletedPostFA);
                      User.findOneAndUpdate(
                        { posts: { $in: [wallPostFinded._id] } },
                        {
                          $pull: { posts: wallPostFinded._id },
                        },
                        {
                          new: true,
                        },
                      ).exec(function (errUs, dataUser) {
                        if (errUs) throw errUs;
                        res.status(200).send({
                          apiData: {
                            deletedPost: deletedPostFA,
                            postsLength: dataUser.posts.length,
                          },
                        });
                      });
                    },
                  );
                });
              } else if (findedUser.uid !== req.session.userId) {
                res.send(
                  'Вы не можете удалять чужие посты не на своей стене!',
                );
              }
            });
          }
        });
      } else if (count === 0) {
        res.send(
          `Пост с postId "${req.body.postId}" не существует или уже удален`,
        );
      }
    },
  );
});

router.put('/test', verifySession, async (req, res) => {
  //  del post

  WallPost.countDocuments(
    { postId: req.body.postId },
    function (errCheck, count) {
      if (errCheck) console.log(errCheck);
      if (count > 0) {
        WallPost.findOne({ postId: req.body.postId }).exec(function (
          err,
          data,
        ) {
          if (err) res.send('Такого поста не существует');
          res.send(data);
        });
        const arrOfIdsCommentsForDeleting = [];
        WallPost.findOne({ postId: req.body.postId }).exec(function (
          err,
          wallPostFinded,
        ) {
          if (err) throw err;
          if (req.session.userId === wallPostFinded.from) {
            wallPostFinded.comments.map((comment) => {
              arrOfIdsCommentsForDeleting.push(comment._id);
              return arrOfIdsCommentsForDeleting;
            });
            Promise.all(
              arrOfIdsCommentsForDeleting.map(async (el) => {
                CommentPost.findByIdAndDelete(
                  el,
                  function (errDel, deletedComments) {
                    if (errDel) throw errDel;
                  },
                );
              }),
            ).then(() => {
              WallPost.findByIdAndDelete(
                wallPostFinded._id,
                function (errDel, deletedPost) {
                  if (errDel) throw errDel;
                  res
                    .status(200)
                    .send({ deletedPostFromApi: deletedPost });
                  console.log('Удален свой пост.');
                  console.log(deletedPost);
                },
              );
            });
          } else if (req.session.userId !== wallPostFinded.from) {
            User.findOne({
              posts: { $in: [wallPostFinded._id] },
            }).exec(function (errU, findedUser) {
              if (errU) throw errU;
              if (findedUser.uid === req.session.userId) {
                wallPostFinded.comments.map((comment) => {
                  arrOfIdsCommentsForDeleting.push(comment._id);
                  return arrOfIdsCommentsForDeleting;
                });
                Promise.all(
                  arrOfIdsCommentsForDeleting.map(async (el) => {
                    CommentPost.findByIdAndDelete(
                      el,
                      function (errDel, deletedComments) {
                        if (errDel) throw errDel;
                      },
                    );
                  }),
                ).then(() => {
                  WallPost.findByIdAndDelete(
                    wallPostFinded._id,
                    function (errDel, deletedPost) {
                      if (errDel) throw errDel;
                      console.log(
                        'Удален свой пост или пост на своей стене.',
                      );
                      console.log(deletedPost);
                      res
                        .status(200)
                        .send({ deletedPostFromApi: deletedPost });
                    },
                  );
                });
              } else {
                res.send(
                  'Вы не можете удалять чужие посты не на своей стене!',
                );
              }
            });
          }
        });
      } else if (count === 0) {
        res.send(
          `Пост с postId "${req.body.postId}" не существует или уже удален`,
        );
      }
    },
  );
});

module.exports = router;
