const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const app = express();
const cors = require("cors");
const fs = require("fs");
const connection = require("./configs/knex.js");

app.use(cors());
app.use(express.json());

const jwtSecret = "IFRN@123";

function authenticateToken(req, res, next) {
  const token = req.headers["x-acess-token"];
  console.log(token);
  if (token == null) {
    res.status(401);
    console.log("estou aqui");
    return;
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.log(err);
      res.status(403);
      return;
    }

    req.user = user;
    next();
  });
}

app.get("/products", async (req, res) => {
  const conexao = new connection();

  const a = await conexao("products")
    .select(
      "id",
      "name as name",
      "description as description",
      "price as price",
      "image as image"
    )
    .distinct();

  return res.json(a);
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;

  const conexao = new connection();
  const teste = await conexao("products").select("*").where("id", id);

  res.status(200).json(teste);
});

app.post("/products", upload.single("image"), async (req, res) => {
  const { name, description, price } = req.body;
  //const image = req.file.filename;
  //const extension = req.file.mimetype.split("/")[1];
  // const imagePath = `uploads/${name}.${extension}`;

  // await fs.writeFile(imagePath, req.file.buffer);

  const conexao = new connection();
  await conexao
    .insert({
      name: name,
      description: description,
      price: price,
      // image: imagePath,
    })
    .into("products");

  res.status(200).json({
    message: "sucesso ao cadastrar produto",
  });

  //res.status(400).json({ error: "No file was uploaded" });
});

app.put("/products/:id", authenticateToken, async (req, res) => {
  const { name, description, price } = req.body;
  const id = req.params.id;

  const conexao = new connection();

  await conexao.select("*").from("products").where("id", id).update({
    name: name,
    description: description,
    price: price,
  });
  res.status(200).json({
    name: name,
    description: description,
    price: price,
  });
});

app.put("/products/foto/:id", authenticateToken, (req, res) => {
  const id = req.params["id"];
  const formulario = new formidable.IncomingForm();
  formulario.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
    } else {
      const caminhoOriginal = files.arquivo[0].filepath;
      console.log(caminhoOriginal);
      const imagem = fs.readFileSync(caminhoOriginal);
      const conexao = new connection();
      try {
        conexao.select("*").from("products").where("id", id).update({
          image: imagem,
        });
        res.status(200).json({
          mensagem: `Sucesso ao editar imagem`,
        });
      } catch (error) {
        res.status(400).json({
          mensagem: `Erro ao gravar mensagem. Erro: ${error}`,
        });
      }
    }
  });
});

app.delete("/products/:id", authenticateToken, async (req, res) => {
  const id = req.params.id;

  const conexao = new connection();
  try {
    const teste = conexao.select("id").from("producst").where("id", id);
    console.log(teste);
    if (!teste) {
      res.status(404).json({
        message: "Registro não localizado!",
      });
    } else {
      await conexao.select("*").from("products").where("id", id).del();
      res.status(200).json({
        message: "Sucesso ao deletar!",
      });
    }
  } catch (error) {
    res.status(400).json({
      message: `${error.message}`,
    });
  }
});

async function hashPassword(password, saltRounds) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    console.error(err.message);
  }
}

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const conexao = new connection();

  try {
    const criptPassword = await hashPassword(password, 10);

    const user = await conexao
      .insert({ username: username, password: criptPassword })
      .into("users");
    return res.status(201).json({ message: "sucesso ao cadastrar usuário" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", status: 500 });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const conexao = new connection();

  try {
    const user = await conexao("users").where("username", username).first();

    if (!user) {
      res.status(401).json({ error: "Authentication failed" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Authentication failed" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret
    );
    res.json({ token, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
