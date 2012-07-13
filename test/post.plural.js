var requireindex = require('requireindex');
var expect = require('expect.js');

var request  = require('./lib/request');
var fixtures = requireindex('./test/fixtures');
  
describe('POST plural', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);

  it('should create a new object and return its ID', function (done) {
      
    var data = {
      name: 'Turnip'
    };
    
    request('POST', '/api/vegetables/', data, function (err, r) {
      if (err) return done(err);
      
      var id = JSON.parse(r.body);
      expect(id).to.not.be.empty();
      
      request('GET', '/api/vegetable/' + id, function (err, r) {
	if (err) return done(err);
	
	expect(r.response.statusCode).to.be(200);
	
	var doc = JSON.parse(r.body);
	expect(doc).to.have.property('name', 'Turnip');
	
	done();
      });
    });
  });
  
});