import request from "supertest";
import app from "../app.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

let token;
let faketoken;
beforeAll(() => {
  const user = { id: "1", name: "lordsoth" };
  const fake = { id: "33", name: "beeble" };
  token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "5m" });
  faketoken = jwt.sign(fake, process.env.ACCESS_TOKEN, { expiresIn: "5m" });
});

describe("/POST register endpoint", () => {
  describe("Without username", () => {
    test("Should return 401 statusCode", async () => {
      const res = await request(app).post("/register").send({
        password: "heythere",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("With a username already registered", () => {
    test("Should return 409 statusCode", async () => {
      const res = await request(app).post("/register").send({
        username: "lordsoth",
        password: "password666",
      });
      expect(res.statusCode).toBe(409);
    });
  });
});

describe("/POST login endpoint", () => {
  describe("Successful login", () => {
    test("Should return 200 statusCode", async () => {
      const res = await request(app).post("/login").send({
        username: "lordsoth",
        password: "password666",
      });
      expect(res.statusCode).toBe(200);
    });

    describe("Successful login2", () => {
      test("Should return valid json", async () => {
        const res = await request(app).post("/login").send({
          username: "lordsoth",
          password: "password666",
        });
        expect(res.headers["content-type"]).toEqual(
          expect.stringContaining("json"),
        );
      });
    });

    describe("with no username", () => {
      test("Should return 401 statusCode", async () => {
        const res = await request(app).post("/login").send({
          password: "Botrdude",
        });
        expect(res.statusCode).toBe(401);
      });
    });
  });

  describe("Username Unknown", () => {
    test("Should return 404 statusCode", async () => {
      const res = await request(app).post("/login").send({
        username: "madeupname1121",
        password: "Botrdude",
      });
      expect(res.statusCode).toBe(404);
    });
  });
});

describe("with no password", () => {
  test("Should return 401 statusCode", async () => {
    const res = await request(app).post("/login").send({
      username: "lordsoth",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("with incorrect password", () => {
  test("Should return 410 statusCode", async () => {
    const res = await request(app).post("/login").send({
      username: "lordsoth",
      password: "Botrdude",
    });
    expect(res.statusCode).toBe(410);
  });
});

describe("/GET tokencheck endpoint", () => {
  test("Should return 200 statusCode", async () => {
    const res = await request(app)
      .get("/tokencheck")
      .set({ Authorization: `Bearer ${token}` });
    expect(res.statusCode).toBe(200);
  });

  describe("without bearer token", () => {
    test("Should return 403", async () => {
      const res = await request(app)
        .get("/tokencheck")
        .set({ Authorization: `Bearer ` });
      expect(res.statusCode).toBe(403);
    });
  });
});

describe("/GET list endpoint", () => {
  describe("if no token", () => {
    test("Should return 403 statusCode", async () => {
      const res = await request(app)
        .get("/list")
        .set({ Authorization: `Bearer ` });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("with valid id", () => {
    test("Should return 200 statusCode", async () => {
      const res = await request(app)
        .get("/tokencheck")
        .set({ Authorization: `Bearer ${token}` });
      expect(res.statusCode).toBe(200);
    });
  });
});

describe("/GET music/:id endpoint", () => {
  describe("with invalid songid", () => {
    test("Should return 404 statusCode", async () => {
      const res = await request(app).get("/music/55");
      expect(res.statusCode).toBe(404);
    });
  });

  describe("with valid songid", () => {
    test("Should return 200 statusCode", async () => {
      const res = await request(app).get("/music/3");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("with valid songid2", () => {
    test("Should return json header", async () => {
      const res = await request(app).get("/music/3");
      expect(res.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });
  });
});

describe("/DELETE music/:id endpoint", () => {
  test("should return 404", async () => {
    const res = await request(app).get("/music/55");
    expect(res.statusCode).toBe(404);
  });
});
