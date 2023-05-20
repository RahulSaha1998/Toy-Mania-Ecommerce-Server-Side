const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qw8qee2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toyCollection = client.db('toyDB').collection('toys')

    //------Search bar implement
    const indexKeys = { product_name: 1 };
    const indexOptions = { name: 'toyName' }
    const result = await toyCollection.createIndex(indexKeys, indexOptions)

    app.get('/toySearch/:text', async (req, res) => {
      const searchText = req.params.text;
      const result = await toyCollection.find({
        $or: [
          { product_name: { $regex: searchText, $options: "i" } }
        ]
      }).toArray()
      res.send(result)
    })    

    //------------------------------------------


    //get all data with set limit of 20 data
    app.get('/toys', async (req, res) => {
      const result = await toyCollection.find().limit(20).toArray();
      res.send(result);
    });

    //get one specific data
    app.get('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toyCollection.findOne(query)
      res.send(result)
    })

    //get some data
    app.get('/myToys', async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      
      let sortOption = { price: 1 }; // Default: Sort in ascending order based on price
      if (req.query?.sort === 'desc') {
        sortOption = { price: -1 }; // Sort in descending order based on price
      }
    
      const result = await toyCollection.find(query).sort(sortOption).toArray();
      res.send(result);
    });
    
    


    //post a data
    app.post('/toys', async (req, res) => {
      const addedToy = req.body;
      // body.createdAt = new Date()

      const result = await toyCollection.insertOne(addedToy);
      console.log(result);
      res.send(result);

    })


    //update
    app.put('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true}
      const updatedToy = req.body;         
            const toy = {
                $set: {
                    price: updatedToy.price,
                    quantity: updatedToy.quantity,
                    details: updatedToy.details
                }
            }

            const result = await toyCollection.updateOne(query, toy, options);
            res.send(result);
    })

    //delete 
    app.delete('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toyCollection.deleteOne(query);
      res.send(result);

    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Toy marketplace server side is running...')
})

app.listen(port, () => {
  console.log(`Toy marketplace server side is running on port: ${port}`);
})