// module imports
const crypto = require('crypto');
const EventEmitter = require('events');
const NodeCache = require('node-cache');
const Redis = require('ioredis');

// variable initializations
const REDIS_URL = process.env.REDIS_URL;
const CACHE_PROVIDER = process.env.CACHE_PROVIDER; // update this to 'redis' or 'node', in the .env file and it will automatically start using that cache provider
// const CACHE_PROVIDERS = ['redis', 'node'];

class CacheManager extends EventEmitter {
  constructor() {
    super(); // initializes EventEmitter
    this.provider = CACHE_PROVIDER.toLowerCase();

    if (this.provider === 'node') {
      this.cache = new NodeCache();

      this.cache.on('set', (key, value) => this.emit('set', key, value));
      this.cache.on('del', (key, value) => this.emit('del', key, value));
      this.cache.on('expired', (key, value) => this.emit('expired', key, value));
      this.cache.on('flush', () => this.emit('flush'));
    } else if (this.provider === 'redis') {
      this.cache = new Redis(REDIS_URL);

      this.cache.on('connect', () => {
        console.log('Redis Connected');
        this.emit('connect');
      });

      this.cache.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.emit('error', err);
      });
    } else {
      throw new Error(`Unsupported cache provider: ${this.provider}`);
    }
  }

  buildCacheKey(prefix = '', reqQuery = {}, includeKeys = []) {
    const filtered = includeKeys.reduce((acc, key) => {
      if (reqQuery[key] !== undefined) {
        acc[key] = reqQuery[key];
      }
      return acc;
    }, {});

    const sorted = Object.keys(filtered)
      .sort()
      .reduce((acc, key) => {
        acc[key] = filtered[key];
        return acc;
      }, {});

    const hash = crypto.createHash('md5').update(JSON.stringify(sorted)).digest('hex');
    return `${prefix}:${hash}`;
  }

  async setCache(key, value, ttl = 300) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);

    if (this.provider === 'node') {
      this.cache.set(key, val, ttl);
    } else if (this.provider === 'redis') {
      await this.cache.set(key, val, 'EX', ttl);
    }

    this.emit('set', key, value, ttl);
  }

  async getCache(key) {
    let data;

    if (this.provider === 'node') {
      data = this.cache.get(key);
    } else if (this.provider === 'redis') {
      data = await this.cache.get(key);
    }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }

    this.emit('get', key, parsed);
    return parsed;
  }

  async delCache(key) {
    let result;
    if (this.provider === 'node') {
      result = this.cache.del(key);
    } else if (this.provider === 'redis') {
      result = await this.cache.del(key);
    }

    this.emit('del', key);
    return result;
  }

  async flushCache() {
    if (this.provider === 'node') {
      this.cache.flushAll();
    } else if (this.provider === 'redis') {
      await this.cache.flushall();
    }

    this.emit('flush');
  }

  async deleteCacheByPattern(pattern) {
    if (this.provider === 'node') {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter((key) => key.startsWith(pattern.split('*')[0]));
      if (matchingKeys.length) {
        this.cache.del(matchingKeys);
        this.emit('deletePattern', matchingKeys);
      }
    } else if (this.provider === 'redis') {
      const keys = await this.cache.keys(pattern);
      if (keys.length) {
        await this.cache.del(keys);
        this.emit('deletePattern', keys);
      }
    }
  }
}

module.exports = new CacheManager();
