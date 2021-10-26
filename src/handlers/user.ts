import { db } from "../db/index.ts";
import { User } from "../db/models/user.d.ts";
import { bcrypt, Bson, Context, Status } from "../../deps.ts";

const users = db.collection<User>("users");

export async function createUser(c: Context) {
  if (!c.request.hasBody) {
    c.response.status = Status.BadRequest;
    return;
  }

  const req = c.request.body({ type: "json" });
  const user = (await req.value) as User;
  const hash = await bcrypt.hash(user.password as string);
  user.password = hash;

  if (user.meta.avatarUrl == null) {
    user.meta.avatarUrl =
      "https://pbs.twimg.com/profile_images/453956388851445761/8BKnRUXg.png";
  }

  try {
    const foundUser = await users.findOne(
      { email: user.email },
      { noCursorTimeout: false },
    );

    if (foundUser) {
      c.response.status = Status.Forbidden;
      c.response.body = "User already exists.";
      return;
    }
  } catch (_error) {
    c.response.status = Status.InternalServerError;
  }

  try {
    const insertedId = await users.insertOne(user);
    if (insertedId) {
      c.response.status = Status.Created;
      c.response.body = "User created.";
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
