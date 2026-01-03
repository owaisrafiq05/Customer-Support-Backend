import multer from "multer";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getRandomFileName } from "../utils/helpers";
import { config } from "dotenv";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

config();

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  filename: string;
}

const bucket_name = process.env.BUCKET_NAME;
const bucket_region = process.env.BUCKET_REGION;
const bucket_access_key = process.env.AWS_BUCKET_ACCESS_KEY_ID;
const bucket_secret_key = process.env.AWS_BUCKET_SECRET_ACCESS_KEY;
const cloudfront_distribution_id = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const cloudfront_url = process.env.CLOUDFRONT_URL;

const s3Client = new S3Client({
  region: bucket_region!,
  credentials: {
    accessKeyId: bucket_access_key!,
    secretAccessKey: bucket_secret_key!,
  },
});

const cloudFront = new CloudFrontClient({
  region: bucket_region!,
  credentials: {
    accessKeyId: bucket_access_key!,
    secretAccessKey: bucket_secret_key!,
  },
});

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

export const uploadFile = async (
  file: MulterFile,
  pathPrefix: string = "uploads/inventory"
) => {
  const filename = `${pathPrefix}/${getRandomFileName()}-${
    file.originalname
  }`;

  const command = new PutObjectCommand({
    Bucket: bucket_name,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  const response = await s3Client.send(command);

  return { response, filename };
};

export const removeFile = async (filename: string) => {
  const command = new DeleteObjectCommand({
    Bucket: bucket_name,
    Key: filename,
  });
  await s3Client.send(command);

  // Invalidate the cloudfront cache for the deleted image
  await invalidateCloudFrontCache(filename);
};

const invalidateCloudFrontCache = async (filename: string) => {
  const invalidationCommand = new CreateInvalidationCommand({
    DistributionId: cloudfront_distribution_id,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: [`/${filename}`],
      },
    },
  });
  await cloudFront.send(invalidationCommand);
};

export const getImageUrl = (filename: string) => {
  return `${cloudfront_url}/${filename}`;
};
