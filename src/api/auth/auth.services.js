/* eslint-disable linebreak-style */
const { db } = require('../../utils/db');
const { hashToken } = require('../../utils/hashTokens');

// used when we create a refresh token.
const addRefreshTokenToWhitelist = async ({ jti, refreshToken, userId }) => {
  return await db.refreshToken.create({
    data: {
      id: jti,
      hashedToken: hashToken(refreshToken),
      userId,
    },
  });
}

// used to check if the token sent by the client is in the database.
const findRefreshTokenById = async (id) => {
  return await db.refreshToken.findUnique({
    where: {
      id,
    },
  });
}

// soft delete tokens after usage.
const deleteRefreshToken = async (id) => {
  return await db.refreshToken.update({
    where: {
      id,
    },
    data: {
      revoked: true,
    },
  });
}

const revokeTokens = async (userId) => {
  return await db.refreshToken.updateMany({
    where: {
      userId,
    },
    data: {
      revoked: true,
    },
  });
}

module.exports = {
  addRefreshTokenToWhitelist,
  findRefreshTokenById,
  deleteRefreshToken,
  revokeTokens,
};
