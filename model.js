const mongoose = require('mongoose')
const schemas = require('./schema')
const Mock = require('mockjs')

const mockData = Mock.mock({
  'persons|5': [
    {
      name: '@name',
      age: '@integer(60, 100)',
      'gender|1': ['male', 'female', 'middle'],
      contacts: {
        wx: '@string("number", 9)',
        tel: /\d{3}-\d{3}-\d{4}/
      }
    }
  ],
  'stories|5': [
    {
      title:'@word',
    }
  ]
})

const DB_URL = 'mongodb://127.0.0.1:27017/share?authSource=dbWithUserCredentials'

/**
 * Model通过Schema配置，可以执行CURD操作,model的实例就是document
 * （1）增加
 * （2）删除
 * （3）更新
 * （4）查询，注意查询这里情况较为复杂，涉及到查询条件、类似于并表的操作、查询结果的聚合操作等
 */

const personModel = mongoose.model('Person', schemas.personSchema)
const storyModel = mongoose.model('Story', schemas.storySchema)

/** 
 * 创建文档、更新文档、查询文档、删除文档
 */

const showFun = async function() {
  try {
    // 往数据库中一次插入多条数据
    const resultArray = await Promise.all([personModel.insertMany(mockData.persons), storyModel.insertMany(mockData.stories)])
    console.log('(1)resultArray\n', resultArray)
    // 往数据库中插入单条数据
    const resultSingle = await (new personModel(mockData.persons[0])).save()
    console.log('(2)resultSingle\n', resultSingle.toJSON())
    // 更新数据库,可通过直接修改document,也可以调用Model.update()等方法更新
    resultSingle.stories = resultArray[1].map(item => item.id)
    resultSingle.friends = resultArray[0].map(item => item.id)
    const resultSingleUpdated = await resultSingle.save()
    console.log('(3)更新后的resultSingle\n', resultSingleUpdated.toJSON())
    // 查询数据库, 这里涉及到查询对象、查询条件、聚合方法等
    const query = personModel.find({ _id: resultSingle.id }, 'name friends stories')
    // populate是联合查询
    const queryResult = await query.populate({
      path: 'friends',
      select: 'name',
      match: { age: { $gt: 18 }},
      options: { sort: { name: -1 }}
    }).populate({
      path: 'stories',
      select: 'title',
    }).exec()
    console.log('(4)查询id为resultSingle.id的人的信息\n', queryResult[0].toJSON())
    // schema中定义的model实例方法
    resultSingle.findOldPeople(function(e, d) {
      console.log('(5)shema中定义的model实例方法\n', d.map(item => item.toJSON()))
    })
    // schema中定义的model静态方法
    personModel.findOldPeople(function(e, d) {
      console.log('(6)shema中定义的model静态方法\n', d.map(item => item.toJSON()))
    })
    // 数据库删除操作
    const resultSingleDeleted = await personModel.findByIdAndDelete(resultSingle.id).exec()
    console.log('(7)删除resultSingle\n', resultSingleDeleted.toJSON())
    // 聚合操作
    const aggregateResult = await personModel.aggregate([
      { $project: { name: 1, age: 1, gender: 1, _id: 0 } },
      { $match: { gender: { $in: [ 'male', 'female' ] }} },
      { $skip: 5 },
      { $limit: 10 }
    ]).then();
    console.log('(8)model聚合操作，涉及一系列操作符\n', aggregateResult)
  } catch (e) {
    console.log(e)
  }
}

/**
 * 连接
 */
mongoose.connect(DB_URL, {auto_reconnect: true, useNewUrlParser: true})

/**
  * 连接成功
  */
mongoose.connection.on('connected', function () {
  console.log('Mongoose connection open to ' + DB_URL)
  showFun()
})

/**
 * 连接异常
 */
mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error: ' + err)
})

/**
 * 连接断开
 */
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected')
})