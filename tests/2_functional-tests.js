const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  //10 functional Tests

  //Create a new thread
  //POST request to /api/threads/:board (like 'project issue')
  test('Test POST request to /api/threads:board to create a new thread', function(done){
    chai
      .request(server)
      .post('/api/threads/Figma')
      .send({
        text: 'This is a test text about Figma.',
        delete_password: '12345'
      })
      .end(function(err, res, body){
        assert.equal(res.status, 200); //redirect status
        assert.equal(typeof(res.body), 'object') //how to improve this test?
        done();
      }) 
  })

  //View 10 most recent threads, 3 replies each
  //GET request to /api/threads/:board
  test('Test GET request to /api/threads/:board to view 10 most recent threads with 3 top replies', function(done){
    chai 
      .request(server)
      .get('/api/threads/Figma')
      .end(function(err, res, body){
        assert.equal(res.status, 200); //test that the response works
        assert.equal(typeof(res.body), 'object', 'response is object'); //response is an object
        assert.equal(res.body.length, 10, 'returns 10 most recent threads') //response contains 10 thread objects
        res.body.forEach(object => 
          assert.isBelow(object.replies.length, 4, 'replies are less than 4')
        ) 
        done();
      })
  })

  //Delete thread with incorrect password
  //DELETE request to /api/threads/:board 
  //invalid delete_password
  test('Test DELETE request to /api/threads/:board to delete thread with incorrect  password', function(done){
    chai 
      .request(server)
      .delete('/api/threads/Python')
      .send({
        thread_id:'604001e08b99360750577d75',
        delete_password: '1225'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      })
  })

  //Delete thread with correct password
  //DELETE request to /api/threads/:board
  //valid delete_password
  test('Test DELETE request to /api/threads/:board to delete thread with correct password', function(done){
    chai
      .request(server)
      .delete('/api/threads/Python')
      .send({
        thread_id:'604001e08b99360750577d75',
        delete_password: '1234'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success', 'returns success');
        done();
      })
  })

  //Report a thread (Update)
  //PUT request to /api/threads/:board
  test('Test PUT request to /api/threads/:board to report a thread', function(done){
    chai
      .request(server)
      .put('/api/threads/Figma')
      .send({
        thread_id:'603c1a3ed635ee0b3f026383',
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "success", 'returns success');
        //how to test that the thread has been reported?
        done();
      })
  })

  //Create a new reply
  //POST request to /api/replies/:board
  //how tho show that it includes this data? 
  test('Test POST request to /api/replies/:board to create a new reply', function(done){
    chai
      .request(server)
      .post('/api/replies/Figma')
      .send({
        thread_id:'603c1a3ed635ee0b3f026383',
        text: 'This is a new reply to test POST request',
        delete_password: '1245'
      })
      .end(function(err, res){
        assert.equal(res.status, 200); //redirect status?
        assert.equal(typeof(res.body), 'object');
        done();
      })
  })

  //Viewing a single thread with all replies
  //GET request to /api/replies/:board
  test('Test GET request to /api/replies/:board to view a single thread with all replies', function(done){
    chai
      .request(server)
      .get('/api/replies/Figma?thread_id=603b16f6c17a2a01c711f603')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(typeof(res.body), 'object', 'response is an object');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.property(res.body, 'replies');
        //assert.property(!res.body, 'reported'); //response does not include reported
        //assert.property(!res.body, 'delete_password'); //response does not included delete password
        done();
      })
  })

  //Delete a reply with incorrect password
  //DELETE request to /api/threads/:board
  //invalid delete_password
  test('Test DELETE request to /api/replies/:board to delete a reply with an incorrect password', function(done){
    chai 
      .request(server)
      .delete('/api/replies/Dog')
      .send({
        thread_id:'604000f619f04e06f872b434',
        reply_id:'6040010519f04e06f872b435',
        delete_password: '1249'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      })
  })

  //Delete a reply with correct password
  //DELETE request to /api/threads/:board
  //valid delete_password
  test('Test DELETE request to /api/replies/:board to delete a reply with a correct password', function(done){
    chai 
      .request(server)
      .delete('/api/replies/Dog')
      .send({
        thread_id:'604000f619f04e06f872b434',
        reply_id:'6040010519f04e06f872b435',
        delete_password: '1234'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success', 'returns success');
        //how do I test that it successfully deleted?
        done();
      })
  })

  //Reporting a reply
  //PUT request to /api/replies/:board 
  //UPDATE?? 
  test('Test PUT request to /api/threads/:board to report a reply', function(done){
    chai
      .request(server)
      .put('/api/replies/Figma')
      .send({
        thread_id:'603ff5ee1421e1030b081dbf',
        reply_id:'603ff5f81421e1030b081dc0'
      })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, "success", 'returns success');
        //how to test that the thread has been reported?
        //use Sinon for testing
        done();
      })
  })

});
