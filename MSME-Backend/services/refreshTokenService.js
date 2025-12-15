/**
 * Refresh Token Service
 * 
 * Implements secure refresh token functionality for extended sessions.
 * Access tokens are short-lived (15min-8h), refresh tokens are long-lived (7 days).
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In production, store refresh tokens in Redis or database
// This in-memory store is for development only
const refreshTokenStore = new Map();

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_TOKEN_EXPIRY_ADMIN = process.env.JWT_ADMIN_EXPIRY || '8h';
const ACCESS_TOKEN_EXPIRY_USER = process.env.JWT_USER_EXPIRY || '24h';

/**
 * Generate a new refresh token
 * @param {number} userId - User or admin ID
 * @param {string} userType - 'admin' or 'user'
 * @returns {Object} { refreshToken, expiresAt }
 */
function generateRefreshToken(userId, userType) {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    // Store the refresh token
    const tokenData = {
        userId,
        userType,
        expiresAt,
        createdAt: new Date(),
        isRevoked: false
    };
    
    refreshTokenStore.set(refreshToken, tokenData);
    
    return { refreshToken, expiresAt };
}

/**
 * Generate a new access token
 * @param {number} userId - User or admin ID
 * @param {string} userType - 'admin' or 'user'
 * @returns {string} JWT access token
 */
function generateAccessToken(userId, userType) {
    const expiresIn = userType === 'admin' ? ACCESS_TOKEN_EXPIRY_ADMIN : ACCESS_TOKEN_EXPIRY_USER;
    
    return jwt.sign(
        { id: userId, type: userType },
        process.env.JWT_SECRET,
        { expiresIn }
    );
}

/**
 * Validate and use a refresh token to get new tokens
 * @param {string} refreshToken - The refresh token to validate
 * @returns {Object|null} { accessToken, refreshToken, user } or null if invalid
 */
async function refreshAccessToken(refreshToken) {
    const tokenData = refreshTokenStore.get(refreshToken);
    
    if (!tokenData) {
        return null;
    }
    
    // Check if token is expired or revoked
    if (tokenData.isRevoked || tokenData.expiresAt < new Date()) {
        refreshTokenStore.delete(refreshToken);
        return null;
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(tokenData.userId, tokenData.userType);
    
    // Optionally rotate refresh token for added security
    // Uncomment to enable rotation:
    // refreshTokenStore.delete(refreshToken);
    // const newRefresh = generateRefreshToken(tokenData.userId, tokenData.userType);
    
    return {
        accessToken,
        refreshToken, // Return same token, or newRefresh.refreshToken if rotating
        userId: tokenData.userId,
        userType: tokenData.userType
    };
}

/**
 * Revoke a refresh token (logout)
 * @param {string} refreshToken - The refresh token to revoke
 */
function revokeRefreshToken(refreshToken) {
    const tokenData = refreshTokenStore.get(refreshToken);
    if (tokenData) {
        tokenData.isRevoked = true;
        refreshTokenStore.set(refreshToken, tokenData);
    }
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param {number} userId - User or admin ID
 * @param {string} userType - 'admin' or 'user'
 */
function revokeAllUserTokens(userId, userType) {
    for (const [token, data] of refreshTokenStore.entries()) {
        if (data.userId === userId && data.userType === userType) {
            data.isRevoked = true;
            refreshTokenStore.set(token, data);
        }
    }
}

/**
 * Clean up expired tokens (run periodically)
 */
function cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of refreshTokenStore.entries()) {
        if (data.expiresAt < now || data.isRevoked) {
            refreshTokenStore.delete(token);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
    generateRefreshToken,
    generateAccessToken,
    refreshAccessToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanupExpiredTokens
};
