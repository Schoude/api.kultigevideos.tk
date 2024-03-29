import { db } from "../db/index.ts";
import { User, UserRole } from "../db/models/user.d.ts";
import { bcrypt, Bson, Context, RouterContext, Status } from "../../deps.ts";
import { initAuthSession, verifyJwt } from "../utils/auth.ts";
import { createUserProfileAggregation } from "../db/pipeline-helpers/user.ts";
import { validateMinLength } from "../utils/validation.ts";

const users = db.collection<User>("users");

export async function createUser(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  let user = (await req.value) as User;
  const hash = await bcrypt.hash(user.password as string);
  user.password = hash;
  user = Object.assign(user, {
    meta: {
      avatarUrl:
        "https://firebasestorage.googleapis.com/v0/b/kultige-videos.appspot.com/o/avatars%2Fdummy-avatar.jpg?alt=media&token=1b1250cb-5bd0-4841-9928-af17224b7465",
    },
  });

  try {
    const foundUser = await users.findOne(
      { email: user.email },
      { noCursorTimeout: false },
    );

    if (foundUser) {
      c.response.status = Status.Forbidden;
      c.response.body = { message: "User already exists." };
      return;
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
  }

  try {
    const insertedId = await users.insertOne(user);
    if (insertedId) {
      c.response.status = Status.Created;
      c.response.body = { message: "User created." };
    } else {
      c.response.status = Status.InternalServerError;
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
  }
}

export async function passwordChange(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { userId, newPassword } = (await req.value) as {
    userId: string;
    newPassword: string;
  };

  if (validateMinLength(newPassword, 5) === false) {
    c.response.status = Status.UnprocessableEntity;
    c.response.body = { message: "The given password was too short." };
    return;
  }

  const hashedNewPassword = await bcrypt.hash(newPassword);

  try {
    const { modifiedCount } = await users.updateOne(
      { _id: new Bson.ObjectId(userId) },
      { $set: { password: hashedNewPassword } },
    );

    if (modifiedCount > 0) {
      c.response.status = Status.OK;
      c.response.body = { message: "New Password saved." };
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal Server Error" };
  }
}

export async function updateUser(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { updatedUser } = (await req.value) as {
    updatedUser: User;
  };

  try {
    const { modifiedCount } = await users.updateOne(
      { _id: new Bson.ObjectId(updatedUser._id) },
      {
        $set: {
          username: updatedUser.username,
          meta: updatedUser.meta,
          email: updatedUser.email,
        },
      },
    );

    if (modifiedCount > 0) {
      // update the user saved in the refreshtoken and the jwt.
      const { cookieConfigRefreshToken, jwt, refreshToken } =
        await initAuthSession<
          User
        >({ me: updatedUser as User });

      await c.cookies.set(
        "__refresh-token__",
        refreshToken,
        cookieConfigRefreshToken,
      );
      c.response.body = { jwt, expires: 300 };
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal Server Error" };
  }
}

export async function getUserProfile(c: RouterContext) {
  const params = c.params as { id: string };

  const jwt = c.request.headers.get("Authentication")?.split(" ")[1];
  const payload = await verifyJwt(jwt as string) as { me: User };
  let skipUnlistedVideos = params.id !== payload.me._id;

  try {
    const profileData = await users.aggregate(
      createUserProfileAggregation(params.id, skipUnlistedVideos),
    ).next();

    c.response.body = profileData;
    c.response.status = Status.OK;
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function getUsersOverview(c: Context) {
  try {
    const usersOverview = await users.find(
      { role: { $ne: "admin" } },
      {
        projection: { password: 0 },
        noCursorTimeout: false,
      },
    ).toArray();

    c.response.body = usersOverview;
    c.response.status = Status.OK;
  } catch (_) {
    c.response.body = { message: "Internal Server Error" };
    c.response.status = Status.InternalServerError;
  }
}

export async function updateUserRole(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const { role, userId } = (await req.value) as {
    userId: string;
    role: UserRole;
  };

  try {
    const { modifiedCount } = await users.updateOne(
      { _id: new Bson.ObjectId(userId) },
      { $set: { role } },
    );

    if (modifiedCount > 0) {
      c.response.status = Status.OK;
      c.response.body = { message: "User role updated." };
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
    c.response.body = { message: "Internal Server Error" };
  }
}
