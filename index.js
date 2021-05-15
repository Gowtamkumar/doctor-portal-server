const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId
const port = 5000

const app = express();
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ty6v7.mongodb.net/${process.env.DB_HOST}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const apCollection = client.db("doctorsPortal").collection("appointment");
    const doctorsCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        console.log(appointment)
        apCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })


    app.post('/appointmentByDate', (req, res) => {
        const date = req.body;
        console.log("text", date.data)
        const email = req.body.email

        doctorsCollection.find({ email: email })

            .toArray((err, doctors) => {
                const filter = { date: date.data }
                if (doctors.length === 0) {
                    filter.email = email
                }
                apCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents)
                    })
            })
    })


    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorsCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0)
            })
    })

    app.get('/todayappointment', (req, res) => {
        apCollection.find({ created: req.query.created })
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    app.get('/appointment/:id', (req, res) => {
        apCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, documents) => {
                res.send(documents[0])
            })
    })

    app.delete('/deletepatient/:id', (req, res) => {
        apCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .toArray(document => {
                res.send(document.deletedCount > 0)
            })
    })




    app.get('/allpatients', (req, res) => {
        apCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    app.get('/totalappointment', (req, res) => {
        apCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    app.post('/addDoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const address = req.body.address;
        const phone = req.body.phone;
        console.log(name, email, file, address, phone)
        const filePath = `${__dirname}/doctors/${file.name}`
        file.mv(filePath, err => {
            if (err) {
                console.log(err)
                return res.status(500).send({ msg: 'Failed to uploads image' });
            }
            return res.send({ name: file.name, path: `/${file.name}` })
        })
        doctorsCollection.insertOne({ name, email, address, phone, img: file.name })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/doctors', (req, res) => {
        doctorsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    app.get('/', (req, res) => {
        res.send('Doctor portal')
    })

    console.log("database connection")

});




app.listen(process.env.PORT || port)