const router = require('express').Router();
const verifyToken = require('../verifytoken/verifytoken');

router.get('/', verifyToken, (req, res) => {
    res.json({
        posts: {
            title: "test"
        }
    })
})

module.exports = router;
