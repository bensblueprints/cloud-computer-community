const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

const META_API = 'https://graph.facebook.com/v21.0';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Multer config: memory storage, 10MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.use(requireAuth);

// FIXED: POST with form-encoded body (not query params)
async function metaPost(endpoint, data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }
  params.append('access_token', META_ACCESS_TOKEN);
  const res = await axios.post(`${META_API}${endpoint}`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data;
}

// GET helper
async function metaGet(endpoint, params = {}) {
  const res = await axios.get(`${META_API}${endpoint}`, {
    params: { access_token: META_ACCESS_TOKEN, ...params }
  });
  return res.data;
}

// Multipart POST for image uploads
async function metaPostMultipart(endpoint, fields, fileBuffer, fileName) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }
  form.append('access_token', META_ACCESS_TOKEN);
  if (fileBuffer) {
    form.append('filename', fileBuffer, { filename: fileName || 'image.jpg', contentType: 'image/jpeg' });
  }
  const res = await axios.post(`${META_API}${endpoint}`, form, {
    headers: form.getHeaders(),
    maxContentLength: 15 * 1024 * 1024
  });
  return res.data;
}

// DELETE helper
async function metaDelete(endpoint) {
  const res = await axios.delete(`${META_API}${endpoint}`, {
    params: { access_token: META_ACCESS_TOKEN }
  });
  return res.data;
}

// ==================== AD ACCOUNTS ====================

router.get('/accounts', async (req, res) => {
  try {
    const data = await metaGet('/me/adaccounts', {
      fields: 'id,name,account_id,account_status,currency,balance,amount_spent'
    });
    res.json(data);
  } catch (err) {
    console.error('Meta accounts error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== CAMPAIGNS ====================

router.get('/accounts/:id/campaigns', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/campaigns`, {
      fields: 'id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta campaigns error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/accounts/:id/campaigns', async (req, res) => {
  try {
    const { name, objective, status, daily_budget, lifetime_budget, special_ad_categories } = req.body;
    const data = await metaPost(`/act_${req.params.id}/campaigns`, {
      name,
      objective: objective || 'OUTCOME_TRAFFIC',
      status: status || 'PAUSED',
      daily_budget,
      lifetime_budget,
      special_ad_categories: special_ad_categories || '[]'
    });
    res.json(data);
  } catch (err) {
    console.error('Meta create campaign error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/campaigns/:id', async (req, res) => {
  try {
    const data = await metaPost(`/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    console.error('Meta update campaign error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== PAGES ====================

router.get('/pages', async (req, res) => {
  try {
    const data = await metaGet('/me/accounts', {
      fields: 'id,name,access_token,picture'
    });
    res.json(data);
  } catch (err) {
    console.error('Meta pages error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== IMAGES ====================

router.post('/accounts/:id/images', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    const data = await metaPostMultipart(
      `/act_${req.params.id}/adimages`,
      {},
      req.file.buffer,
      req.file.originalname
    );
    res.json(data);
  } catch (err) {
    console.error('Meta upload image error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/accounts/:id/images/batch', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images provided' });
    const results = [];
    for (const file of req.files) {
      try {
        const data = await metaPostMultipart(
          `/act_${req.params.id}/adimages`,
          {},
          file.buffer,
          file.originalname
        );
        results.push({ filename: file.originalname, success: true, data });
      } catch (uploadErr) {
        results.push({ filename: file.originalname, success: false, error: uploadErr.response?.data?.error?.message || uploadErr.message });
      }
    }
    res.json({ results });
  } catch (err) {
    console.error('Meta batch upload error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.get('/accounts/:id/images', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/adimages`, {
      fields: 'id,hash,name,url,url_128,permalink_url,width,height,created_time,status',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta images error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.delete('/accounts/:id/images/:hash', async (req, res) => {
  try {
    const data = await metaDelete(`/act_${req.params.id}/adimages?hash=${req.params.hash}`);
    res.json(data);
  } catch (err) {
    console.error('Meta delete image error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== CREATIVES ====================

router.get('/accounts/:id/creatives', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/adcreatives`, {
      fields: 'id,name,title,body,image_hash,image_url,thumbnail_url,object_story_spec,status,created_time',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta creatives error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/accounts/:id/creatives', async (req, res) => {
  try {
    const { name, page_id, image_hash, message, headline, description, link_url, cta_type } = req.body;
    const object_story_spec = {
      page_id,
      link_data: {
        image_hash,
        link: link_url,
        message: message || '',
        name: headline || '',
        description: description || '',
        call_to_action: {
          type: cta_type || 'LEARN_MORE',
          value: { link: link_url }
        }
      }
    };
    const data = await metaPost(`/act_${req.params.id}/adcreatives`, {
      name: name || `Creative ${Date.now()}`,
      object_story_spec: JSON.stringify(object_story_spec)
    });
    res.json(data);
  } catch (err) {
    console.error('Meta create creative error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.get('/creatives/:id', async (req, res) => {
  try {
    const data = await metaGet(`/${req.params.id}`, {
      fields: 'id,name,title,body,image_hash,image_url,thumbnail_url,object_story_spec,status'
    });
    res.json(data);
  } catch (err) {
    console.error('Meta creative detail error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== AD SETS ====================

router.get('/accounts/:id/adsets', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/adsets`, {
      fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,billing_event,optimization_goal,bid_amount,start_time,end_time,created_time',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta adsets error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/accounts/:id/adsets', async (req, res) => {
  try {
    const {
      name, campaign_id, status, daily_budget, lifetime_budget,
      billing_event, optimization_goal, bid_amount,
      targeting, start_time, end_time
    } = req.body;
    const payload = {
      name,
      campaign_id,
      status: status || 'PAUSED',
      daily_budget,
      lifetime_budget,
      billing_event: billing_event || 'IMPRESSIONS',
      optimization_goal: optimization_goal || 'LINK_CLICKS',
      bid_amount,
      targeting: typeof targeting === 'string' ? targeting : JSON.stringify(targeting || { geo_locations: { countries: ['US'] } }),
      start_time,
      end_time
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    const data = await metaPost(`/act_${req.params.id}/adsets`, payload);
    res.json(data);
  } catch (err) {
    console.error('Meta create adset error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== ADS ====================

router.get('/accounts/:id/ads', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/ads`, {
      fields: 'id,name,adset_id,campaign_id,creative{id,name,thumbnail_url,image_url,object_story_spec},status,created_time,updated_time',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta ads error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/accounts/:id/ads', async (req, res) => {
  try {
    const { name, adset_id, creative_id, status } = req.body;
    const data = await metaPost(`/act_${req.params.id}/ads`, {
      name: name || `Ad ${Date.now()}`,
      adset_id,
      creative: JSON.stringify({ creative_id }),
      status: status || 'PAUSED'
    });
    res.json(data);
  } catch (err) {
    console.error('Meta create ad error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

router.post('/ads/:id', async (req, res) => {
  try {
    const data = await metaPost(`/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    console.error('Meta update ad error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== INSIGHTS ====================

router.get('/accounts/:id/insights', async (req, res) => {
  try {
    const { date_preset, time_range, level, breakdowns } = req.query;
    const params = {
      fields: 'campaign_name,adset_name,ad_name,impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions',
      date_preset: date_preset || 'last_7d',
      level: level || 'campaign'
    };
    if (time_range) params.time_range = time_range;
    if (breakdowns) params.breakdowns = breakdowns;
    const data = await metaGet(`/act_${req.params.id}/insights`, params);
    res.json(data);
  } catch (err) {
    console.error('Meta insights error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ==================== AUDIENCES ====================

router.get('/accounts/:id/audiences', async (req, res) => {
  try {
    const data = await metaGet(`/act_${req.params.id}/customaudiences`, {
      fields: 'id,name,description,approximate_count,data_source,delivery_status,subtype',
      limit: 100
    });
    res.json(data);
  } catch (err) {
    console.error('Meta audiences error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
