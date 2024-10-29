  const { db } = require('../../utils/db');
  const { paginate } = require('../../utils/globalFunction');
const { supabase } = require('../../utils/supabase');

const getPortfolio = async (page, limit, filters) => {
  try {
    return await paginate(db.portfolio, page, limit, filters);
  } catch (error) {
    throw error;
  }
}

const createPortfolio = async (payload) => {
  try {
    return await db.portfolio.create({
      data: {
        ...payload,
      }
    });
  } catch (error) {
    throw error;
  }
}

const updatePortfolio = async (id, payload) => {
  try {
    return await db.portfolio.update({
      where: { id },
      data: payload,
    });
  } catch (error) {
    throw error;
  }
}

const deletePortfolio = async (id) => {
  try {
    return await db.portfolio.delete({ where: { id } });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
};

