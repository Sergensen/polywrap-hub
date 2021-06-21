import axios from "axios";
import { NextFunction, Request, Response, Router } from "express";

import { User } from "../models/User";
import { ghCallback } from "../services/github/strategy";

const router = Router();

const checkAccessToken = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const auth = request.headers.authorization || "";
  const isAuthed = auth.includes("token");
  if (!isAuthed) {
    return response.json({
      status: 404,
      message: "Authorization header is missing",
    });
  }

  const [_, token] = auth.split(" ");
  request.accessToken = token;
  return next();
};

const handleSignIn = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { address, authType } = request.query;
  try {
    if (address) {
      // @TODO: Improve this
      const user = await User.findOrCreateByAddress({
        address: address as string,
        authType: Number(authType) || 1,
      });
      return response.json({
        status: 200,
        user,
      });
    }
  } catch (error) {
    response.json({
      status: 500,
      error: error.message,
    });
  }

  return next();
};

const authHandler = async (request: Request, response: Response) => {
  const data = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: request.params.code,
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  const codeRequest = await axios.post(
    "https://github.com/login/oauth/access_token",
    data,
    config
  );

  if ("error" in codeRequest.data) {
    return response.json({
      status: 503,
      message: codeRequest.data.error,
    });
  }

  try {
    await ghCallback(codeRequest.data.access_token);
    return response.json({
      status: 200,
      ...codeRequest.data,
    });
  } catch (e) {
    return response.json({
      status: 503,
      error: e.message,
    });
  }
};

router.get("/sign-in", handleSignIn);
router.get("/github/callback/:code", authHandler);

export { checkAccessToken, router as AuthController };
