var express = require('express')
var router = express.Router()
var Repository = require('../connection/query').Repository
var repo = new Repository()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
});

router.post('/login', async (req, res) => {
  //check for authorization
  const email = req.body.email
  const password = req.body.password

  var ans = await repo.query('select * from person where email = :email and password = :password', {
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
})

router.post('/signup', async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  var transactionQuery =  "declare \n" +
                          "person_id number; \n" +
                          "begin \n" +
                          "insert into person (email, password) values (:email, :password); \n" +
                          "select id into person_id from person where email=(:email); \n" +
                          "insert into member(memberid) values(person_id);" +
                          "commit; \n" +
                          "end;"
  var ans = await repo.query(transactionQuery, {
    email: email,
    password: password
  })
  console.log(ans)

  if(ans.success === true){
    res.send({
      token: 'test123'
    })
  }else{
    res.send({
      token: ''
    })
  }

  // var ans = await repo.query('insert into person(email, password) values(:email, :password)', {
  //   email: email,
  //   password: password
  // })

  //do a transaction here as described in Navicat
})

module.exports = router
