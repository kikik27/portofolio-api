const multer = require("multer");
const path = require("path");

async function paginate(model, page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;

  const totalItems = await model.count({
    where: filters,
  });

  const data = await model.findMany({
    skip: skip,
    take: limit,
    where: filters,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const totalPages = Math.ceil(totalItems / limit);
  const nextPage = page < totalPages ? page + 1 : null;
  const previousPage = page > 1 ? page - 1 : null;

  return {
    message: `${model.name} fetched successfully`,
    data,
    meta: {
      currentPage: page,
      nextPage,
      previousPage,
      pageSize: limit,
      totalItems,
      totalPages,
    }
  };
}

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      req.body.title + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

function sendResponse(res, statusCode, message, data = null) {
  const response = {
    message,
    data,
  };

  return res.status(statusCode).json(response);
}


module.exports = {
  paginate,
  diskStorage,
  sendResponse,
};