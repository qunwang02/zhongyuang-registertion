const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./config');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) return this.db;
      
      this.client = new MongoClient(config.mongodb.uri, config.mongodb.options);
      await this.client.connect();
      
      this.db = this.client.db(config.mongodb.database);
      this.isConnected = true;
      
      console.log('✅ MongoDB连接成功');
      
      // 创建索引
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB连接失败:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      const records = this.db.collection('zhongyuan_records');
      
      // 创建索引以提高查询性能
      await records.createIndex({ localId: 1 }, { unique: true });
      await records.createIndex({ createdAt: -1 });
      await records.createIndex({ name: 1 });
      await records.createIndex({ project: 1 });
      await records.createIndex({ submittedAt: -1 });
      await records.createIndex({ deviceId: 1 });
      await records.createIndex({ syncStatus: 1 });
      await records.createIndex({ payment: 1 });
      
      console.log('✅ MongoDB索引创建成功');
    } catch (error) {
      console.error('❌ 创建索引失败:', error);
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('✅ MongoDB连接已关闭');
      }
    } catch (error) {
      console.error('❌ 关闭MongoDB连接失败:', error);
    }
  }

  // 获取记录集合
  records() {
    if (!this.db) {
      throw new Error('数据库未连接');
    }
    return this.db.collection('zhongyuan_records');
  }

  // 获取系统日志集合
  logs() {
    if (!this.db) {
      throw new Error('数据库未连接');
    }
    return this.db.collection('logs');
  }
}

// 创建单例实例
const database = new Database();

module.exports = database;