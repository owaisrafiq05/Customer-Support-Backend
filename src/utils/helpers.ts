import { CustomError } from "../middlewares/error.middleware";
import crypto from "crypto";

export const throwError = (
  message: string | any,
  statusCode?: number
): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode || 500;
  return error;
};

export const getRandomFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

export const getPaginatedData = async ({
  model,
  page = 1,
  limit = 10,
  query = {},
  populate,
  select = "-password",
  sort = { createdAt: -1 },
}: {
  model: any;
  page?: number;
  limit?: number;
  query?: any;
  populate?: any;
  select?: string;
  sort?: any;
}) => {
  const options = {
    select,
    sort,
    page,
    limit,
    populate,
    lean: true,
    customLabels: {
      totalDocs: "totalItems",
      docs: "data",
      limit: "perPage",
      page: "currentPage",
      meta: "pagination",
    },
  };

  const { data, pagination } = await model.paginate(query, options);

  return { data, pagination };
};
