const express = require('express');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173', "https://hyper-market-67575.web.app", "https://hyper-market-67575.firebaseapp.com"],
    credentials: true
}))

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcdfjvb.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const database = client.db("taskManagementDB");
        const usersCollection = database.collection("users");


        app.get('/users/:email', async (req, res) => {
            try {
                const email = req.params.email;

                const user = await usersCollection.findOne({ email });

                res.status(200).json(user);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            const email = user.email
            const existingUser = await usersCollection.findOne({ email })
            if (existingUser) {
                res.send("email already exists")
            } else {
                const result = await usersCollection.insertOne(user)
                res.send(result)
            }

        })

        app.put('/addTask/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const newTodo = req.body;
                const filter = { email: email };

                const existingUser = await usersCollection.findOne(filter);

                const existingTodoArray = existingUser.tasks?.todo || [];

                const updateUser = {
                    $set: {
                        "tasks.todo": [...existingTodoArray, newTodo]
                    }
                };

                const result = await usersCollection.updateOne(filter, updateUser);

                res.status(200).json({ message: 'Task added to todo', result });
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        app.put('/users/tasks/:email', async (req, res) => {

            try {
                const userEmail = req.params.email;
                const updatedTasks = req.body;
                const filter = { email: userEmail };
                const updateUser = {
                    $set: {
                        tasks: updatedTasks
                    }
                };
                console.log(updatedTasks);
                // Update the tasks for the user with the specified email
                const result = await usersCollection.updateOne(
                    filter,
                    updateUser
                );
                console.log(result);
                res.send(result)
            } catch (error) {
                console.error('Error updating tasks:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});