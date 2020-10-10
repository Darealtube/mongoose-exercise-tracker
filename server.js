const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid');
const cors = require('cors')
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const options = {
  new: true,
  upsert: true,
  setDefaultsOnInsert: true
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true , useUnifiedTopology: true} )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var dataSchema = new Schema({
  Username: String,
  _id: {type: String, default: shortid.generate},
  Description: String,
  Duration: Number,
  Date: String,
  Log: [{
  Description: String,
  Duration: Number,
  Date: String
  }]
})

var Data = mongoose.model("Data", dataSchema);

//ADD USERNAME
app.post('/api/exercise/new-user', (req,res)=>{
  Data.exists({Username: req.body.username}, function(err, result){
    if (err) console.log(err)
     if(result === true){
       res.json({error: 'Username already taken'})
     }
    
    if (result === false){
      Data.findOneAndUpdate(
        {Username: req.body.username}, 
        {$set: {Username: req.body.username}},
        options, function(err,data){
        if (err) console.log(err)
         res.json({Username: data.Username, _id: data._id})
      })
    }
  })
})


//ADD EXERCISES
app.post('/api/exercise/add', (req,res)=>{
  if(new Date(req.body.date).getTime() != new Date(req.body.date).getTime()){
        res.json({error:'Invalid Date'});
      }else{
    
  Data.exists({_id: req.body.userId}, function(err,result){
    if (err) console.log(err)
    if (result === true){
      var datas = {
        Description: req.body.description, 
        Duration: req.body.duration, 
        Date: req.body.date = '' ? new Date().toUTCString() : new Date(req.body.date).toUTCString()
      }
      
      Data.findOneAndUpdate(
        {_id: req.body.userId},
        {$set: {Description: req.body.description, Duration: req.body.duration, Date: req.body.date = '' ? new Date(Date.now()).toUTCString() : new Date(req.body.date).toUTCString()}},
        options, function(err, data){
          if (err) console.log(err)
          res.json({Username: data.Username, _id: data._id, Duration: data.Duration, Date: data.Date, Description: data.Description})
        })
      
      //PUSH DATA TO LOGS
      Data.update({ _id: req.body.userId }, { $push: { Log: datas } }, function(err,data){
        if (err) console.log(err)
      });
    }
    
    if(result === false){
      res.json({error: 'User not found'});
    }
    
  })
      }
})


app.post('/api/exercise/log',(req,res)=>{
  Data.exists({_id: req.body.Idlog}, function(err,data){
    if (err) console.log(err)
    
    if (data === false){
      res.json({error: "User not found"})
    }
    
    if(data === true){
      Data.findOne({_id: req.body.Idlog}, function(err,data){
        if (err) console.log(err)
        res.json({Logs: data.Log})
      })
    }
  })
})



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage
  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
