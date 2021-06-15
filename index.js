const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();
const admin = require("firebase-admin");
//
const app = express();
app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./old-egg-firebase-adminsdk-d40i5-a9e1ff9ffb.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vwiqv.mongodb.net/productData?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const productCollection = client.db("productData").collection("products");
  const orderCollection = client.db("productData").collection("orders");

  app.get("/products", (req, res) => {
    productCollection.find().toArray((err, result) => {
      res.send(result);
    });
  });
  app.get("/product/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    productCollection.find({ _id: id }).toArray((err, result) => {
      res.send(result);
    });
  });

  app.post("/addProduct", (req, res) => {
    const products = req.body;
    productCollection.insertOne(products).then((result) => {
      if (result.insertedCount > 0) {
        res.redirect("/");
      }
    });
  });

  app.delete("/deleteProduct/:id", (req, res) => {
    const id = ObjectID(req.params.id);
    productCollection
      .findOneAndDelete({ _id: id })
      .then((deleteResult) => res.send(deleteResult))
      .catch((err) => console.error("Failed to find and delete document"));
  });

  app.post("/addOrder", (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.get("/orders", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          let tokenEmail = decodedToken.email;
          let headersEmail = req.query.email
          if (tokenEmail == headersEmail ) {
            orderCollection
              .find({ email: headersEmail })
              .toArray((err, result) => {
                res.send(result);
              });
          }
        })
        .catch((error) => {
          console.log(error)
        });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
