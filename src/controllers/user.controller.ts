import { NextFunction, Request, Response } from "express";
import { getPaginatedData } from "../utils/helpers";
import { User } from "../models/user.model";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const filter: any = req.query.filter || "";
    let sortDirection = 1;

    if (filter.toLowerCase() === "ztoa") {
      sortDirection = -1;
    }

    const { data, pagination } = await getPaginatedData({
      model: User,
      query: { name: { $regex: `^${search}`, $options: "i" } },
      page,
      limit,
      sort: { name: sortDirection },
      select: "-password",
    });

    return res.status(201).json({
      success: true,
      message: "",
      data,
      pagination,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
