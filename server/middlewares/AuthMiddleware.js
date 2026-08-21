import jwt from "jsonwebtoken";

export const verifyToken = (
  request,
  response,
  next,
) => {
  const token =
    request.cookies.jwt;

  if (!token) {
    return response
      .status(401)
      .json({
        message:
          "You are not authenticated",
      });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, user) => {
      if (error) {
        return response
          .status(403)
          .json({
            message:
              "Token is not valid",
          });
      }

      request.userId =
        user.id;

      next();
    },
  );
};