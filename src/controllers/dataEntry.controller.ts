import { NextFunction, Request, Response } from "express";
import { DataEntry } from "../models/dataEntry.model";
import { throwError } from "../utils/helpers";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  uploadFile,
  removeFile,
  getImageUrl,
} from "../services/storage.service";
import { getPaginatedData } from "../utils/helpers";

export const createDataEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { title, description, value } = req.body;

    if (!title) return next(throwError("Title is required", 400));
    if (value === undefined || value === null)
      return next(throwError("Value is required", 400));

    let imageFilename: string | null = null;

    if (req.file) {
      try {
        const { filename } = await uploadFile(req.file, "uploads/data-entries");
        imageFilename = filename;
      } catch (error) {
        return next(throwError("Failed to upload image", 500));
      }
    }

    const dataEntry = await DataEntry.create({
      title,
      description: description || "",
      value: Number(value),
      image: imageFilename,
      createdBy: req.user._id,
    });

    const imageUrl = dataEntry.image ? getImageUrl(dataEntry.image) : null;

    return res.status(201).json({
      success: true,
      message: "Data entry created successfully",
      data: {
        ...dataEntry.toObject(),
        imageUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDataEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const page = +(req.query.page || 1);
    const limit = +(req.query.limit || 10);
    const search = req.query.search || "";
    const createdBy = req.query.createdBy || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const { data, pagination } = await getPaginatedData({
      model: DataEntry,
      query,
      page,
      limit,
      sort: { createdAt: -1 },
      populate: {
        path: "createdBy",
        select: "name email avatar",
      },
    });

    const dataWithImage = data.map((entry: any) => {
      return {
        ...entry,
        image: entry.image ? getImageUrl(entry.image) : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Data entries retrieved successfully",
      data: dataWithImage,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

export const getDataEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) return next(throwError("Data entry ID is required", 400));

    const dataEntry = await DataEntry.findById(id).populate({
      path: "createdBy",
      select: "name email avatar",
    });

    if (!dataEntry) return next(throwError("Data entry not found", 404));

    return res.status(200).json({
      success: true,
      message: "Data entry retrieved successfully",
      data: {
        ...dataEntry.toObject(),
        image: dataEntry.image ? getImageUrl(dataEntry.image) : null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateDataEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;
    const { title, description, value } = req.body;

    if (!id) return next(throwError("Data entry ID is required", 400));

    const dataEntry = await DataEntry.findById(id);
    if (!dataEntry) return next(throwError("Data entry not found", 404));

    if (dataEntry.createdBy.toString() !== req.user._id.toString()) {
      return next(
        throwError(
          "Unauthorized: You can only update your own data entries",
          403
        )
      );
    }

    if (title !== undefined) dataEntry.title = title;
    if (description !== undefined) dataEntry.description = description;
    if (value !== undefined) {
      dataEntry.value = Number(value);
    }

    if (req.file) {
      if (dataEntry.image) {
        try {
          await removeFile(dataEntry.image);
        } catch (error) {
          console.error("Error removing old image:", error);
        }
      }

      try {
        const { filename } = await uploadFile(req.file, "uploads/data-entries");
        dataEntry.image = filename;
      } catch (error) {
        return next(throwError("Failed to upload image", 500));
      }
    }

    await dataEntry.save();

    return res.status(200).json({
      success: true,
      message: "Data entry updated successfully",
      data: {
        ...dataEntry.toObject(),
        image: dataEntry.image ? getImageUrl(dataEntry.image) : null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteDataEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (!req.user) return next(throwError("Unauthorized Access", 401));

    const { id } = req.params;

    if (!id) return next(throwError("Data entry ID is required", 400));

    const dataEntry = await DataEntry.findById(id);
    if (!dataEntry) return next(throwError("Data entry not found", 404));

    if (dataEntry.createdBy.toString() !== req.user._id.toString()) {
      return next(
        throwError(
          "Unauthorized: You can only delete your own data entries",
          403
        )
      );
    }

    if (dataEntry.image) {
      try {
        await removeFile(dataEntry.image);
      } catch (error) {
        console.error("Error removing image from S3:", error);
      }
    }

    await DataEntry.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Data entry deleted successfully",
      data: "",
    });
  } catch (error) {
    return next(error);
  }
};
