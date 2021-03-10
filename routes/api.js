'use strict';
const mongoose = require ('mongoose');
const {ObjectID} = require ('mongodb');

module.exports = function (app, messageSchema) {
  
app.route('/api/threads/:board') 
  //GET request
  //returned will be array of most recent 10 bumped threads on the board with only the most recent 3 replies for each
  //reported and delete_password are NOT sent
  .get(async (req, res) => {
    let board = req.params.board; //this indicates which board to get items form
    const MessageBoard = mongoose.model(board, messageSchema);
    console.log(board);
    console.log(MessageBoard);
    //just find the 10 most recent bumped threads
    //of these you only get the 3 most recent replies under reply_id
    //how to limit to the 3 most recent replies
    //need to fix this b/c not clear what the replies parameters are

    return await MessageBoard
                            .find()
                            .sort({bumped_on: 'desc'})
                            .limit(10) //limit to 10 most recent bumped threads
                            .select({
                              text:1, 
                              created_on:1, 
                              replycount: 1, 
                              bumped_on:1, 
                              replies: 1
                            }) 
                            //only pick the top three
                            //select 3 most recent replies or the first three**
                            //but is it most recent, or just the first three??
                            .exec(function(err, data){
      if (err) return res.redirect('/');

      //I need to slice only the first three reply objects in replies
      const editedData = data.map(element => {
        element.replies = element.replies.slice(0,3)
        return element;
      })
      return res.send(editedData);
    })

  })

  //POST request
  //form data with 'text' and 'delete_password'
  //database record have fields _id, text, created_on, bumped_on, reported, delete_password, replies
  //each request is async
  .post(async (req, res) => {
    let board = req.params.board;
    const {text, delete_password} = req.body;
    const MessageBoard = mongoose.model(board, messageSchema);
    
    console.log(board);

    //create new document
    const thread = new MessageBoard ({
      text: text,
      delete_password: delete_password,
      created_on: new Date().toISOString(),
      bumped_on: new Date().toISOString(),
      reported: false,
      replycount: 0,
      replies: []
    })
    //save document to model
    return await thread.save((err, data)=> {
      if (err) return res.redirect('/');
      console.log('success')
      console.log(data); //redirect to the message board
      return res.redirect('/b/'+board+'/');
    })
  })

  //PUT request
  //pass along thread_id
  //returned value will be string 'success' (res.send)
  //'reported' value of thread_id will be changed to true
  .put(async (req, res) => {
    let board = req.params.board;
    const {thread_id} = req.body;
    const MessageBoard = mongoose.model(board, messageSchema);
    return await MessageBoard.findOne({_id: thread_id}).exec(async (err, thread) => {
    //find out if id exists
    if (!thread || err){
      return err;
    } else {
      thread.reported = true; //is bumped on updated as well????
      return await thread.save((err, data)=> {
        if (err) return res.redirect('/');
        return res.send('success');
      })
    }
    })
  })

  
  //DELETE request
  //pass along the thread_id & delete_password
  //to delete thread
  //returned will be string 'incorrect password' or 'success' (res.send)
  .delete(async (req, res) => {
    let board = req.params.board;
    let {thread_id, delete_password} = req.body;
    console.log('deleting')

    const MessageBoard = mongoose.model(board, messageSchema);
    return await MessageBoard.findOne({_id: thread_id}).exec(async (err, data) => {
      //find if id exists
      if (!data || err){
        return res.send('no thread')
      }
      const storedPassword = data.delete_password;
      if (delete_password != storedPassword){
          return res.send('incorrect password')
      } else {
          return await MessageBoard.remove({_id: thread_id}).exec((err, data) => {
            if (err) return res.redirect('/');
            return res.send('success');
        })
      }
    })
  })
    //this works



app.route('/api/replies/:board')
  //GET request
  //api/replies/:board?thread_id=:thread_id
  //returned will be entire thread with all replies
  //reported and delete_password are NOT sent
  .get(async (req, res) => {    
    let board = req.params.board;
    let thread_id = req.query.thread_id;
    if(thread_id === undefined){
      thread_id = req.body.thread_id;
    }

    const MessageBoard = mongoose.model(board, messageSchema);
    return await MessageBoard.findOne({_id: thread_id}).select('text created_on bumped_on replies').exec((err, data) => {
        if (err) return res.send('error');
        if (!data){
          return res.send('no thread with this id found')
        }
        return res.send(data);
      })
  })

  //POST request
  //form data 'text', 'delete_password', 'thread_id'
  //this updates the 'bumped_on' date to the comment's date
  //in the thread's replies array, an object will be saved with the properties _id, text, created_on, delete_password, reported
  .post(async (req, res) => {
    let board = req.params.board;
    let {thread_id, text, delete_password} = req.body;
    //find board
    const MessageBoard = mongoose.model(board, messageSchema);
    //find thread
    //what if you can't find this board?

    return await MessageBoard.findOne({_id: thread_id}).exec(async (err, thread)=> {
      if (!thread || err){
        return res.redirect('/');
      }
      //found thread now
      //update bumped_on date
      thread.bumped_on = new Date().toISOString();
      //create reply object
      const replyObject = {
        text: text,
        created_on: new Date().toISOString(),
        delete_password: delete_password,
        reported: false,
        //this doesn't contain an id
      }
      //push new replyObject to thread
      //put it at the beginning
      thread.replies.unshift(replyObject);
      thread.replycount++;
      //save new thread
      return await thread.save((err, data) => {
        if (err) return res.redirect('/');
        //redirect to the message board
        //'/b/:board/:threadid'
        res.redirect('/b/'+board+'/'+data._id);
      })
    })
  })

  //PUT request
  //report a reply
  //pass along the thread_id & reply_id
  //returned will be string 'success'
  //reported value of reply_id will be 'true'
  .put(async (req, res) => {
    let board = req.params.board;
    const {thread_id, reply_id} = req.body;

    const MessageBoard = mongoose.model(board, messageSchema);
    return await MessageBoard.findOne({_id: thread_id}).exec(async (err, thread) => {
      //find the thread here
      if (!thread || err){
        return err;
      } else {
        //we have found the thread here
        //need to search through thread for the particular reply

        //find the reply 
        const replyIdList = thread.replies.map(reply => reply._id);
        const targetIndex = replyIdList.indexOf(reply_id);
        if (targetIndex < 0){ //user replyId does not match replyIDs in replies
          return res.send('incorrect reply id')
        } else {
          //reply_id matches reply
          thread.replies[targetIndex].reported = true;
          //save it back to the model
          return await thread.save((err, data) => {
            if (err) return res.redirect('/');
            return res.send('success')
          })
        }
      }
    })
  })

    //DELETE request
  //pass along thread_id, reply_id, delete_password
  //returned will be string 'incorrect password' or 'success' 
  //if 'success', then text of reply_id will be changed to [deleted]
  .delete(async (req, res) => {
    let board = req.params.board
    const {thread_id, reply_id, delete_password} = req.body;
    
    //find the model
    const MessageBoard = mongoose.model(board, messageSchema);
    //find the thread
    await MessageBoard.findOne({_id: thread_id}).exec(async (err, thread)=>{
      if(!thread ||err){
        return res.redirect('/');
      }
      //found the thread now

      //how to delete the reply in the thread?
      //check 1 - find the Index of the reply that includes the reply_id
      const replyIdList = thread.replies.map(reply => reply._id);
      const targetIndex = replyIdList.indexOf(reply_id);

      //if there is no such id, redirect back to res.redirect('/');
      if (targetIndex < 0){
        return res.redirect('/');
      } else {
        //the reply_id exists, now check the reply's delete_password
        //if it matches the user input
        //if it does not match
        if (delete_password != thread.replies[targetIndex].delete_password){
          return res.send('incorrect password');
        } else {
          //user's delete_password matches the reply's delete_password
          //update the text to [deleted]
          thread.replies[targetIndex].text = '[deleted]';
          //save it back to the model
          return await thread.save((err, data) => {
            if (err) return res.redirect('/');
            return res.send('success');
          })

        }
      }
    })

  })

} //close module
