var express = require('express')
var router = express.Router()
var Repository = require('../connection/query').Repository
var repo = new Repository()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', async (req, res) => {
  //check for authorization
  const email = req.body.email
  const password = req.body.password

  var ans = await repo.query('select * from person where username = :email and password = :password', {
    email: email,
    password: password
  })
  console.log(ans)

  if(ans.success === true && ans.data.length > 0){
    res.send({
      token: 'test123'
    })
  }else{
    res.send({
      token: ''
    })
  }
});

module.exports = router;
