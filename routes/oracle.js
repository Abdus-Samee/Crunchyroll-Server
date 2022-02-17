var express = require('express')
var router = express.Router()
var oracledb = require('oracledb')
var fs = require('fs')
var Repository = require('../connection/query').Repository
const res = require('express/lib/response')
var repo = new Repository()

/***
 * fetches all animes from the database
 */
router.get('/anime', async (req, res, next) => {
    var ans = await repo.query('select * from anime', {})
    console.log(ans)
    res.send(ans.data)
    // oracledb.getConnection({
    //     user: "hr",
    //     password: "hr",
    //     connectString: "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID= ORCL)))"
    // }, (err, con) => {
    //     if(err){
    //         console.log('Cannot connect...')
    //         console.log(err)
    //         res.send(err)
    //     }
    //     else{
    //         var q = 'select * from anime'

    //         binds = {}

    //         // For a complete list of options see the documentation.
    //         options = {
    //             outFormat: oracledb.OUT_FORMAT_OBJECT, // query result format
    //         }

    //         con.execute(q, binds, options, (e, a) => {
    //             if(e) res.send(e)
    //             else{
    //                 res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
    //                 res.send(a.rows)
    //             }
    //         })
    //     } 
    // })
})

/**
 * fetches a particular anime with the parameter animeId from the database
 */
router.get('/anime/:animeId', async (req, res, next) => {
  //need to fetch the average ratings from the review table...
  const animeId = req.params.animeId
  var ans = await repo.query('select * from anime where animeid = :animeId', {
    animeId: animeId
  })
  console.log(ans)
  
  res.send(ans.data[0])
})

/**
 * fetches the strings of all the episode names of a particular anime with the parameter animeId from the database
 */
router.get('/anime/episodes/:animeId', async (req, res, next) => {
  const animeId = req.params.animeId
  var ans = await repo.query('select * from animeepisodes where animeid = :animeId', {
    animeId: animeId 
  })
  console.log(ans)

  res.send(ans.data)
})

/**
 * fetches a particular episode of a particular anime from the database
 */
 router.get('/anime/:animeId/:episode', async (req, res, next) => {
  // Ensure there is a range given for the video
  const range = req.headers.range
  // get video stats (about 61MB)
  const videoPath = "public/videos/" + req.params.animeId + "/" + req.params.episode + ".mp4"
  const videoSize = fs.statSync(videoPath).size
  console.log(videoPath)
  console.log(videoSize)

  if (!range) {
    const head = {
        'Content-Length': videoSize,
        'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(videoPath).pipe(res)
  }else{
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6 // 1MB
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

    // Create headers
    const contentLength = end - start + 1
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end })

    // Stream the video chunk to the client
    videoStream.pipe(res)
  }
})
  
/**
 * fetches all the reviews of a particular anime from the database
 */
router.get('/animereview/:animeId', async (req, res, next) => {
  const animeId = req.params.animeId
  var ans = await repo.query('select * from animereview where animeid = :animeId', {
    animeId: animeId
  })
  console.log(ans)

  res.send(ans.data)
})

/**
 * fetches the overall review only of a particular anime for an unlogged user
 */
router.get('/animereview/total/:animeId', async (req, res, next) => {
  const animeId = req.params.animeId
  var ans = await repo.query('select sum(rating)/count(memberid) count from animereview where animeid = :animeId', {
    animeId: animeId
  })
  console.log(ans)

  res.send(ans.data[0])
})

/**
 * checks if a particular user has already reviewed a particular anime
 */
router.get('/animereview/:animeId/:userId', async (req, res, next) => {
  const animeId = req.params.animeId
  const userId = req.params.userId
  var selectReview = 'select sum(rating)/count(memberid) count, '+
                     '(select memberid from animereview where animeid=:animeId and memberid=:userId) member, '+
                     '(select rating from animereview where animeid=:animeId and memberid=:userId) rating '+
                     'from animereview where animeid=:animeId group by animeid'
  var ans = await repo.query(selectReview, {
    animeId: animeId,
    userId: userId
  })
  console.log(ans)

  res.send(ans.data)
})

/**
 * older route which checks if a particular user has already reviewed a particular anime
 */
// router.get('/animereview/:animeId/:userId', async (req, res, next) => {
//   const animeId = req.params.animeId
//   const userId = req.params.userId
//   var ans = await repo.query('select * from animereview where animeid = :animeId and memberid = :userId', {
//     animeId: animeId,
//     userId: userId
//   })
//   console.log(ans)

//   res.send(ans.data)
// })
 
/**
 * registers rating for a particular anime
 */
router.post('/animereview/:animeId', async (req, res, next) => {
    const animeId = req.params.animeId
    const rating = req.body.rating
    const reviewText = req.body.reviewText
    const userid = req.body.userID

    var insertReview  = "declare \n" +
                         "begin \n" +
                         "insert into animereview(memberid, animeid, text, rating, time) values(:userid, :animeId, :reviewText, :rating, sysdate);\n" + 
                         "commit; \n" +
                         "end;"

    var ans = await repo.query(insertReview, {
        userid: userid,
        animeId: animeId,
        reviewText: reviewText,
        rating: rating,
    })
    console.log(ans)

    res.send(ans)
})

/**
 * fetches all the genre names from the database
 */
router.get('/genres', async (req, res, next) => {
  var ans = await repo.query('select * from genre', {})
  console.log(ans)
  res.send(ans.data)
})

//try updating useEffect in client side Genre component and call separately for anime and manga
router.get('/animegenre/:genre', async (req, res, next) => {
  var ans = await repo.query('select * from anime where animeid in (select animeid from animegenre where genrename=:genre)', {
    genre: req.params.genre
  })

  console.log(ans)
  res.send(ans.data)
})

router.get('/mangagenre/:genre', async (req, res, next) => {
  var ans = await repo.query('select * from manga where mangaid in (select mangaid from mangagenre where genrename=:genre)', {
    genre: req.params.genre
  })

  console.log(ans)
  res.send(ans.data)
})

router.get('/video', (req, res) => {
  // Ensure there is a range given for the video
  const range = req.headers.range
  // get video stats (about 61MB)
  const videoPath = "public/videos/102.mp4"
  const videoSize = fs.statSync("public/videos/102.mp4").size
  console.log(videoPath)
  console.log(videoSize)

  if (!range) {
    const head = {
        'Content-Length': videoSize,
        'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(videoPath).pipe(res)
  }else{
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6 // 1MB
    const start = Number(range.replace(/\D/g, ""))
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1)

    // Create headers
    const contentLength = end - start + 1
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end })

    // Stream the video chunk to the client
    videoStream.pipe(res)
  }
})

/**
 * testing route for sending pdf as a response
 */
router.get('/pdf', (req, res) => {
  var data =fs.readFileSync('public/pdf/manga.pdf')
  res.contentType("application/pdf")
  res.send(data)
})

/**
 * fetches all mangaas from the database
 */
 router.get('/manga', async (req, res, next) => {
  var ans = await repo.query('select * from manga', {})
  console.log(ans)
  res.send(ans.data)
})

/**
 * fetches a particular manga with the parameter mangaId from the database
 */
 router.get('/manga/:mangaId', async (req, res, next) => {
  const mangaId = req.params.mangaId
  var ans = await repo.query('select * from manga where mangaid = :mangaId', {
    mangaId: mangaId
  })
  console.log(ans)
  
  res.send(ans.data[0])
})

/**
 * fetches all the chapter names of a particular manga from the database
 */
router.get('/manga/chapters/:mangaId', async (req, res, next) => {
  const mangaId = req.params.mangaId
  var ans = await repo.query('select chapter from mangachapters where mangaid = :mangaId', {
    mangaId: mangaId
  })
  console.log(ans)
  res.send(ans.data)
})

/**
 * fetches the pdf of the concerned chapter of a particular manga from the database
 */
router.get('/manga/:mangaId/:chapter', async (req, res, next) => {
  const mangaId = req.params.mangaId
  const chapter = req.params.chapter
  var data =fs.readFileSync('public/pdf/'+mangaId+'/'+chapter+'.pdf')
  res.contentType("application/pdf")
  res.send(data)
})

/**
 * fetches all the strings of the images of a particular chapter of a particular manga from the database
 */
router.get('/manga/image/:mangaId/:chapter', async (req, res, next) => {
  const mangaId = req.params.mangaId
  const chapter = req.params.chapter
  var image = fs.readFileSync('public/images/' + mangaId + '/' + chapter + '.jpg')
  res.contentType("image/png")
  res.send(image)
})

/**
 * fetches all the blogs from the database
 */
router.get('/blogs', async (req, res, next) => {
  var ans = await repo.query('select * from blog', {})
  console.log(ans)
  res.send(ans.data)
})

/**
 * stores blogs written by an admin
 */
router.post('/blogs', async (req, res, next) => {
  const title = req.body.title
  const text = req.body.text
  const id = req.body.id

  var ans = await repo.query('select blog_func(:id, :title, :text) rep from dual', {
    title: title,
    text: text,
    id: id
  })
  console.log(ans)

  res.send({
    reply: ans.data[0]["REP"]
  })
})

/**
 * fetches a blog with a particular id
 */
router.get('/blogs/:id', async (req, res, next) => {
  var ans = await repo.query('select * from blog where blogid = :id', {
    id: req.params.id 
  })
  console.log(ans)

  res.send(ans.data[0])
})

/**
 * fetches all the comments of a particular blog
 */
router.get('/comments/:blogid', async (req, res, next) => {
  var ans = await repo.query('select * from comments where blogid = :blogid', {
    blogid: req.params.blogid
  })
  console.log(ans)

  res.send(ans.data)
})

/** 
 * stores a comment written by a member
 */
router.post('/blogs/:id', async (req, res, next) => {
  var insertComment  = "declare \n" +
                "begin \n" +
                "insert into comments(blogid, text) values(:id, :txt);\n" + 
                "commit; \n" +
                "end;"
  var ans = await repo.query(insertComment, {
    id: req.params.id,
    txt: req.body.comment
  })

  console.log(ans)
  res.send(ans)
})

/**
 * fetches all the plans from the database
 */
router.get('/plan', async (req, res, next) => {
  var ans = await repo.query('select * from plan', {})
  console.log(ans)

  res.send(ans.data)
})

router.post('/plan', async (req, res, next) => {
  res.status(200).send({
    message: "plan posted",
    success: true
  })
})

module.exports = router