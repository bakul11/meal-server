const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//MiddleWare
app.use(express.json());
const cors = require("cors");
app.use(cors());
const port = process.env.PORT || 5000;
require("dotenv").config();


//Jwt token 
const jwt = require('jsonwebtoken');



// ================== MongoDB Connection Start =================

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctebc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//JWT Implement Here

const varifyJWT = (req, res, next) => {
    const author = req.headers.authorization;

    if (!author) {
        return res.status(401).send({ message: 'UnAuthorization' })
    }
    const token = author.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_ACCESS_KEY, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
    });

}


async function run() {
    try {
        await client.connect();
        const foodCollection = client.db("foodData").collection("foodAll");
        const bookingCollection = client.db("bookingOrder").collection("order");
        const userCollection = client.db("allUser").collection("user");
        console.log('Database Connected Successfully');


        //Load All Food Data
        app.get('/allFood', varifyJWT, async (req, res) => {
            const food = await foodCollection.find({}).toArray();
            res.send(food)
        })

        //Add Food Post Method
        app.post('/allFood', varifyJWT, async (req, res) => {
            const food = req.body;
            const addFood = await foodCollection.insertOne(food);
            res.send(addFood);
        })

        //Get Single Food
        app.get('/singleFood/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const food = await foodCollection.findOne(filter)
            res.send(food)
        })


        //Post Booking Order 
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const bookingOrder = await bookingCollection.insertOne(booking)
            res.send(bookingOrder)
        })

        //Load All Food Data

        app.get('/allOrder', varifyJWT, async (req, res) => {
            const food = await bookingCollection.find({}).toArray();
            res.send(food)
        })


        //User Booking Order 
        app.get('/myOrder', varifyJWT, async (req, res) => {
            const email = req.query.email;
            const decoded = req.decoded.email;
            if (email === decoded) {
                const query = { email: email }
                const book = await bookingCollection.find(query).toArray();
                return res.send(book)
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })


        //Delete Your Order 
        app.delete('/deleteOrder/:id', async (req, res) => {
            const id = req.params.id;
            const remove = { _id: ObjectId(id) };
            const removePro = await bookingCollection.deleteOne(remove)
            res.send(removePro);
        })



        //Sign In User Post Method
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.TOKEN_ACCESS_KEY, { expiresIn: '1h' });
            res.send({ result, token });
        })


        //load All User 
        app.get('/allUser', varifyJWT, async (req, res) => {
            const user = await userCollection.find({}).toArray();
            res.send(user);
        })


        //Make Admin
        app.put('/user/admin/:email', varifyJWT, async (req, res) => {
            const email = req.params.email;
            const requesterEmail = req.decoded.email;
            const newAdmin = await userCollection.findOne({ email: requesterEmail });
            if (newAdmin.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' }
                }
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })

        //Remove Admin
        app.delete('/removeAdmin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const removeAdmin = await userCollection.deleteOne(filter);
            res.send(removeAdmin);
        })

        //Check Admin 
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

    }
    finally {

    }
}
run().catch(console.dir)

// ================== MongoDB Connection End ===================


app.get('/', (req, res) => {
    res.send('Server Start Successfully...');
})

app.listen(port, () => {
    console.log("server start success done");
})
