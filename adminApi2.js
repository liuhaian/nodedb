const express = require('express')
const query = require('./query')
const jwt = require('./jwt');
const bodyParser = require('body-parser')
const mongoquery = require('./mongoquery');

const dicTable = {
  'category': 'lime_survey_category',
  'survey': 'lime_survey',
  'group': 'lime_survey_group',
  'plan': 'lime_survey_plan',
  'user': 'sys_user'
}

function isNumber(obj) {
  return typeof obj === 'number' && !isNaN(obj)
}

const getRequests = [
  { api: '/category_list', sql: 'select id as code, category_title as name from lime_survey_category where active = 1' },
  { api: '/allSurveys', sql: 'select sid, survey_title, survey_description, category_id from lime_survey where active=1' }
]

const dicSql = {
  'category': 'select id, category_title, category_description from lime_survey_category where active=1',
  'survey': 'select id, sid, survey_title, survey_description, category_id from lime_survey where active=1',
  'group': 'select id, group_title, group_description, topics from lime_survey_group where active=1',
  'plan': 'select id, group_id, depids2, plan_title, start_time, end_time from lime_survey_plan where status=1',
  'report': `select A.plan_id, B.plan_title, A.uid, C.name from (SELECT plan_id, uid, min(status) as fstatus FROM lime_user_survey group by plan_id, uid) as A 
  inner join lime_survey_plan B on A.plan_id=B.id and B.status=1 and A.fstatus = 1
  inner join sys_user C on A.uid=C.id order by A.plan_id desc`,
  'staff': 'select id,account, name, sex,pwd, depid2,idcard from sys_user where active=1'
}

const router = express.Router()
router.use(bodyParser.json())

router.get('/', async(req, res) => {
  // 现在
  const rows = await query('select * from sys_user')
  res.json({
    code: 0,
    msg: '请求成功',
    data: rows
  })
})

router.post('/addUser', jwt.authenticateToken, async(req, res) => {
  if (!req.body.name || !req.body.pwd || !req.body.account) {
    res.json({
      code: -1,
      msg: '参数错误',
      body: req.body
    })
    return
  }
  try{
    var sql = `insert into sys_user(name, account, pwd) values('${req.body.name}','${req.body.account}','${req.body.pwd}');`;
    const rows = await query(sql)
    res.json({
      code: 0,
      msg: '请求成功',
      data: rows
    })    
  }catch (err) {
   if (err.code === 'ER_DUP_ENTRY') {
       //handleHttpErrors(SYSTEM_ERRORS.USER_ALREADY_EXISTS);
      res.json({
        code: -1,
        msg: '用户已存在'
      })    
   } else {
       //handleHttpErrors(err.message);
      res.json({
        code: -1,
        msg: '系统错误：'+err.message
      })
    }
  }

})

router.post('/login', async(req, res) => {
  if (!req.body.pwd || !req.body.account) {
    res.json({
      code: -1,
      msg: '参数错误',
      body: req.body
    })
    return
  }
  var sql = `select id, name, account, pwd from sys_user where account = '${req.body.account}' and pwd = '${req.body.pwd}';`;
  const rows = await query(sql);
  if(rows.length == 0){
    res.json({
      code: -1,
      msg: '用户名或者密码错误'
    })
    return    
  }
  var token = jwt.generateAccessToken({account:req.body.account});
  res.json({
    code: 0,
    msg: '请求成功',
    data: rows,
    token: token
  })
})

router.post('/getRecord', async(req, res) => {
  var sql = dicSql[req.body.cls]
  if (!sql) {
    res.json({
      code: -1,
      msg: '参数错误',
      body: req.body
    })
    return
  }
  const rows = await query(sql)
  res.json({
    code: 0,
    msg: '请求成功',
    data: rows
  })
})

router.get('/getMongoRecord', async(req, res) => {
  const rows = await mongoquery.R('inventory','test',{"a":"b"});
  res.json({
    code: 0,
    msg:'请求成功',
    data: rows
  })
})



function composeSQL(req) {
  const cls = dicTable[req.body.cls]
  const op = req.body.op
  const vo = req.body.vo
  if (!cls || !vo || !op) {
    return null
  }
  if (op == 'c') {
    const str0 = 'insert into '
    const str1 = '(active'
    const str2 = ') values (1'
    const strend = ');'

    var sql0 = str0 + cls + str1
    var sql1 = str2
    for (var k in vo) {
      if (k.startsWith('$')) continue
      if (vo[k] == null) continue
      sql0 = sql0 + ',' + k
      sql1 = sql1 + `,'${vo[k]}'`
    }
    return sql0 + sql1 + strend
  } else if (op == 'u') {
    const str0 = 'update '
    const str1 = ' set '
    const strend = ` where id=${vo.id};`

    var sql0 = str0 + cls + str1
    var cnt = 0
    for (var k in vo) {
      if (k.startsWith('$') || k == 'id') continue
      if (vo[k] == null) continue
      if (cnt == 0) {
        sql0 = sql0 + `${k}='${vo[k]}'`
      } else {
        sql0 = sql0 + `,${k}='${vo[k]}'`
      }

      cnt++
    }
    return sql0 + strend
  } else if (op == 'd') {
    return `update ${cls} set active='0' where id=${vo.id};`
  }
}

router.post('/getRecord', async(req, res) => {
  var sql = dicSql[req.body.cls]
  if (!sql) {
    res.json({
      code: -1,
      msg: '参数错误',
      body: req.body
    })
    return
  }
  const rows = await query(sql)
  res.json({
    code: 0,
    msg: '请求成功',
    data: rows
  })
})

router.post('/opRecord', async(req, res) => {
  // 现在
  // {"cls":"survey","vo":{"k":"v"}}
  //
  var sqlv = composeSQL(req)
  if (sqlv == null) {
    res.json({
      code: -1,
      msg: '参数错误',
      body: reg.body
    })
    return
  }
  // res.json({sql:sqlv});
  const rows = await query(sqlv)
  res.json({
    code: 0,
    msg: '请求成功',
    data: rows
  })
})

module.exports = router
