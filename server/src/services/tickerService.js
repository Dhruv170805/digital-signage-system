const Ticker = require('../models/Ticker');
const axios = require('axios');

class TickerService {
  constructor() {
    this.apiCache = new Map(); // Cache for API tickers: url -> { data, timestamp }
  }

  async getAll() {
    return await Ticker.find().sort({ priority: -1 });
  }

  async getById(id) {
    return await Ticker.findById(id);
  }

  async create(data) {
    const ticker = new Ticker(data);
    return await ticker.save();
  }

  async update(id, data) {
    return await Ticker.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Ticker.findByIdAndDelete(id);
  }

  async getActive(screenId = null, groupId = null) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const query = {
      isActive: true,
      $or: [
        { targetType: 'all' }
      ]
    };

    if (screenId) {
      query.$or.push({ targetType: 'screen', targetIds: { $in: [screenId.toString()] } });
    }

    if (groupId) {
      query.$or.push({ targetType: 'group', targetIds: { $in: [groupId.toString()] } });
    }

    const tickers = await Ticker.find(query).sort({ priority: -1 });

    const validTickers = tickers.filter(t => {
      if (t.startTime && t.endTime) {
        if (t.startTime <= t.endTime) {
          if (currentTime < t.startTime || currentTime > t.endTime) return false;
        } else {
          if (currentTime < t.startTime && currentTime > t.endTime) return false;
        }
      }
      return true;
    });

    if (validTickers.length === 0) return [];
    const highestPriority = validTickers[0].priority;
    const priorityTickers = validTickers.filter(t => t.priority === highestPriority);
    
    return await this.resolveTickers(priorityTickers);
  }

  async resolveTickers(tickers) {
    const resolved = [];
    for (const ticker of tickers) {
      const tickerObj = ticker.toObject ? ticker.toObject() : ticker;
      if (ticker.type === 'api' && ticker.linkUrl) {
        try {
          // Simple caching: 5 minutes
          const cached = this.apiCache.get(ticker.linkUrl);
          if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            tickerObj.text = cached.data;
          } else {
            const res = await axios.get(ticker.linkUrl);
            // Handle common API response formats
            let text = '';
            if (typeof res.data === 'string') text = res.data;
            else if (res.data.message) text = res.data.message;
            else if (res.data.text) text = res.data.text;
            else if (res.data.data && typeof res.data.data === 'string') text = res.data.data;
            else text = JSON.stringify(res.data);
            
            this.apiCache.set(ticker.linkUrl, { data: text, timestamp: Date.now() });
            tickerObj.text = text;
          }
        } catch (err) {
          console.error(`Failed to fetch ticker API: ${ticker.linkUrl}`, err.message);
          tickerObj.text = `API Error: ${ticker.linkUrl}`;
        }
      }
      resolved.push(tickerObj);
    }
    return resolved;
  }
}

module.exports = new TickerService();
