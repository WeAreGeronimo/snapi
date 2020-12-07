const router = require('express').Router();
const verify = require('../verifytoken/verifytoken');

router.get('/', verify, (req, res) => {
    res.json({
        posts: {
            title: "test"
        }
    })
})

module.exports = router;
