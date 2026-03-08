const { createHash } = require('crypto');

const CACHE_DURATIONS = {
    NAATS_LIST: 60,      // 60 seconds
    SINGLE_NAAT: 60,     // 60 seconds  
    USER_PROFILE: 60     // 60 seconds
};

function generateETag(data) {
    return createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
}

function applyCacheHeaders(req, res, data, cacheDuration) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return false; // Don't cache empty data
    }
    
    const etag = generateETag(data);
    
    // Check if client has cached version
    if (etag === req.headers['if-none-match']) {
        res.status(304).end();
        return true;
    }
    
    // Set cache headers for client-side caching
    res.set({
        'Cache-Control': `max-age=${cacheDuration}, must-revalidate`,
        'ETag': etag,
        'Last-Modified': new Date().toUTCString()
    });
    
    return false;
}

module.exports = {
    durations: CACHE_DURATIONS,
    generateETag,
    applyCacheHeaders
};