const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.crkhnnq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const cookeOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const bookCollection = client
      .db("bookstoreDB")
      .collection("booksCollection");
    const authorCollection = client
      .db("bookstoreDB")
      .collection("authorsCollection");

    // auth related api

    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, cookeOption).send({
        status: true,
      });
    });

    app.post("/logout", (req, res) => {
      const user = req.body;

      res
        .clearCookie("token", { ...cookeOption, maxAge: 0 })
        .send({ success: true });
    });

    // service related api
    // books post api
    app.post("/book-collection-post-api", async (req, res) => {
      const bookData = req.body;
      const result = await bookCollection.insertOne(bookData);
      res.send(result);
    });
    // all books get api
    app.get("/allBooks-get-api", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get a single book api
    app.get("/allBooks-get-api/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
    });
    // get books data for a specific user
    app.get("/allBooks-get-api", logger, verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookCollection.find().toArray();
      res.send(result);
    });
    // Update a Book
    // Food updated
    app.put("/book-update-api/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateBookData = req.body;
      const book = {
        $set: {
          bookName: updateBookData.bookName,
          bookImage: updateBookData.bookImage,
          description: updateBookData.description,
          publishedDate: updateBookData.publishedDate,
          authorName: updateBookData.authorName,
        },
      };
      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });

    // Delete a book api

    app.delete("/book-delete-api/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });

    //authors post api
    app.post("/author-collection-post-api", async (req, res) => {
      const authorData = req.body;
      const result = await authorCollection.insertOne(authorData);
      res.send(result);
    });
    // all authors get api
    app.get("/allAuthors-get-api", async (req, res) => {
      const cursor = authorCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get a single author api
    app.get("/allAuthors-get-api/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await authorCollection.findOne(query);
      res.send(result);
    });
    // get author data for a specific user
    app.get("/allAuthors-get-api", logger, verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await authorCollection.find().toArray();
      res.send(result);
    });
    // Delete an author api

    app.delete("/author-delete-api/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await authorCollection.deleteOne(query);
      res.send(result);
    });
    // Update An Author Api
    app.put("/author-update-api/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateAnAuthorData = req.body;
      const author = {
        $set: {
          authorName: updateAnAuthorData.authorName,
          authorImage: updateAnAuthorData.authorImage,
          description: updateAnAuthorData.description,
          bio: updateAnAuthorData.bio,
          birthDate: updateAnAuthorData.birthDate,
        },
      };
      const result = await authorCollection.updateOne(filter, author, options);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gym is running");
});

app.listen(port, () => {
  console.log(`Gym is running on port ${port}`);
});
