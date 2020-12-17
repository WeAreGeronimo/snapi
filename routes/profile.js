const router = require('express').Router({ mergeParams: true });
const User = require('../models/user');
const WallPost = require('../models/post');
require('dotenv/config');
const verifySession = require('../verifytoken/verifytoken');

router.get('/:id', async (req, res) => {
  const finded = await User.findOne({ uid: req.params.id });

  User.findOne({ uid: req.params.id })
    .populate('posts')
    .exec(function (err, data) {
      if (err) throw err;
      const result = data.posts;
      const idsWithNames = [];
      const correctPosts = [];
      const findedUsers = [];
      const allIds = [];
      result.map((post) => {
        return allIds.push(post.from);
      });
      const arrayOfIdsWithoutDuplicates = Array.from(new Set(allIds));
      Promise.all(
        arrayOfIdsWithoutDuplicates.map(async (el) => {
          findedUsers.push(await User.findOne({ uid: el }));
        }),
      ).then(() => {
        for (let i = 0; i < findedUsers.length; i++) {
          for (
            let j = 0;
            j < arrayOfIdsWithoutDuplicates.length;
            j++
          ) {
            if (
              findedUsers[i].uid === arrayOfIdsWithoutDuplicates[j]
            ) {
              idsWithNames.push({
                name: findedUsers[i].name,
                nickname: findedUsers[i].nickname,
                surname: findedUsers[i].surname,
                idForSearch: arrayOfIdsWithoutDuplicates[j],
              });
            }
          }
        }
        for (let i = 0; i < result.length; i++) {
          correctPosts.push({
            postId: result[i].postId,
            likes: result[i].likes,
            comments: result[i].comments,
            from: result[i].from,
            whenTime: result[i].whenTime,
            text: result[i].text,
          });
        }
        const finalArray = [];
        for (let i = 0; i < idsWithNames.length; i++) {
          for (let j = 0; j < correctPosts.length; j++) {
            if (
              idsWithNames[i].idForSearch === correctPosts[j].from
            ) {
              finalArray.push({
                ...correctPosts[j],
                ...idsWithNames[i],
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
            const idsWithNames = [];
            idsWithNames.push({
              name: finded.name,
              nickname: finded.nickname,
              surname: finded.surname,
            });
            const finalArray = [];
            finalArray.push({
              ...correctArray[0],
              ...idsWithNames[0],
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

router.post('/api/likecheck', async (req, res) => {
  const idFinded = req.session.userId;
  const findedPost = WallPost.find({
    postId: req.body.postId,
    likes: { $in: [req.session.userId] },
  }).exec(function (err, results) {
    if (err) {
      res.send(err);
    }
    if (results.length !== 0) {
      res.send({
        'resultss(if)': results,
        resultslength2: results.length,
      });
    } else if (results.length === 0) {
      res.send({
        'resultss(elseif)': results,
        resultslength2: results.length,
      });
    }
  });
});

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
module.exports = router;
