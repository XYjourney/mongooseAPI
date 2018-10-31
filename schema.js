const mongoose = require('mongoose')
const Schema = mongoose.Schema
/**
 * schema 定义表结构，用于生成model, 特点如下
 * （1）定义表的字段及索引，10种数据类型
 * （2）定义虚拟字段（类似vue的计算属性）
 * （3）定义字段别名，好处在于节省空间和带宽
 * （2）定义model实例（文档）的方法
 * （3）定义model静态方法
 * （4）定义查询对象的实例方法
 * （5）丰富的配置项，影响数据库性能、安全等多方面
 * */

const personSchema = new Schema({
  name: String,
  age: {
    type: Number,
    // 字段级别索引
    index: true,
  },
  gender: {
    type: String,
    enum: ['male','female','middle']
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }],
  // 引用文档
  stories: [{
    type: Schema.Types.ObjectId,
    ref: 'Story'
  }],
  // 子文档或者叫嵌套文档
  contacts: {
    wx: String,
    tel: {
      type: String,
      validate: {
        validator: function(v) {
          return /\d{3}-\d{3}-\d{4}/.test(v);
        },
        message: props => `${props.value} 不是正确的手机号!`
      },
      required: [true, '手机必须填']
    }
  } 
 }, {
  autoIndex: true, // 默认为true, 会影响数据库性能
  autoCreate: true, // 默认为false, 自动调用mongodbapi创建collection
  bufferCommands: false,
  // capped: 1024, // 设定collection的大小，单位是字节
  collection: 'customedShare', // 自定义集合名称，如果不设定，集合名称按照model的名称命名
  id: true, // 默认为true, mongoose默认添加给schema的虚拟字段
  _id: true, // 子文档是否拥有_id字段，只能用于子文档
  minimize: true, // 默认值为true, 是否存储空对象
  writeConcern: {
    w: 'majority', // [0, 1, >1, majority, tag] 
    j: true, // journal模式
    wtimeout: 1000 // 超时设定
  },
  strict: true, // 默认为true, 是否存储schema定义之外的数据
  toJSON: { getters: true },
  toObject: { getters: true },
  valiedateBeforeSave: true, // 默认值为true, 表示文档在保存前自动验证
  versionKey: '_somethingElse', // 默认为__v, 版本字段名 注意只有在使用save方法时才会更新版本号，update不会更新
  timestamps: { createdAt: 'created_at'}, // 当设定timestamps配置项时，系统会在schema中自动添加createdAt和updatedAt两个字段
  selectPopulatedPaths: true, // 默认为true, 是否在调用populate()时显示populated的文档。
  storeSubdocValidationError: true, // 默认为true, 是否存储嵌套文档在验证中的错误
})
// 虚拟字段，不占数据库存储空间，this指向文档
personSchema.virtual('isOld').get(function () {
  return this.age > 18
})
// model实例方法，this指向model实例即文档
personSchema.methods.findOldPeople = function (cb) {
  return this.model('Person').find({ age: { $gt: 18 }}, cb)
}
// model静态方法，this指向model
personSchema.statics.findOldPeople = function (cb) {
  return this.find({ age: { $gt: 18 }}, cb)
}
// 建立复合索引，注意符合索引只能用如下方法
personSchema.index({name: 1, age: -1}) 

const storySchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Person'
  },
  t: {
    type: String,
    alias: 'title'
  },
  fans: [{
    type: Schema.Types.ObjectId,
    ref: 'Person'
  }]
})

module.exports = {
  personSchema,
  storySchema
}