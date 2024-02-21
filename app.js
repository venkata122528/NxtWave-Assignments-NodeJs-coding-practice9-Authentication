const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

let db = null;
app.use(express.json());

const initializeDataBaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running On Port 3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDataBaseAndServer();

//To Register New User

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const isUserThereCheck = `SELECT * FROM user WHERE username='${username}';`;
  const userCheck = await db.get(isUserThereCheck);
  if (userCheck === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const toCreateUserQuery = `INSERT INTO 
            user(username,name,password,gender,location) 
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(toCreateUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//To Login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const isUserThereCheck = `SELECT * FROM user WHERE username='${username}';`;
  const userCheck = await db.get(isUserThereCheck);
  if (userCheck === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, userCheck.password);
    if (isPasswordSame) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//To Update Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(getUserQuery);
  const isPasswordSame = await bcrypt.compare(oldPassword, userData.password);
  if (isPasswordSame) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const toUpdatePasswordQuery = `UPDATE user 
            SET password='${hashedPassword}' 
            WHERE username='${username}';`;
      await db.run(toUpdatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
