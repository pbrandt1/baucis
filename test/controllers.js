var expect = require('expect.js');
var mongoose = require('mongoose');
var express = require('express');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var request = require('request');
var baucis = require('..');

var fixtures = require('./fixtures');

describe('Controllers', function () {
  before(fixtures.controller.init);
  beforeEach(fixtures.controller.create);
  after(fixtures.controller.deinit);

  it('should allow passing string name only to create', function (done) {
    var makeController = function () {
      baucis.rest({ singular: 'store', publish: false });
    };
    expect(makeController).to.not.throwException();
    done();
  });

  it('should support select options for GET requests', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses',
      qs: { sort: 'name' },
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('length', 3);
      expect(body[1]).to.have.property('color', 'Yellow');
      expect(body[1]).to.have.property('name', 'Cheddar');
      expect(body[1]).not.to.have.property('_id');
      expect(body[1]).not.to.have.property('cave');
      done();
    });
  });

  it('should support select options for POST requests', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses',
      json: true,
      body: { name: 'Gorgonzola', color: 'Green' }
    };
    request.post(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(201);
      expect(body).to.have.property('color', 'Green');
      expect(body).to.have.property('name', 'Gorgonzola');
      expect(body).not.to.have.property('_id');
      expect(body).not.to.have.property('cave');
      done();
    });
  });

  it('should support select options for PUT requests', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Cheddar',
      json: true,
      body: { color: 'White' }
    };
    request.put(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('color', 'White');
      expect(body).to.have.property('name', 'Cheddar');
      expect(body).not.to.have.property('_id');
      expect(body).not.to.have.property('cave');
      done();
    });
  });

  it('should allow POSTing when fields are deselected (issue #67)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores',
      json: true,
      body: { name: "Lou's" }
    };
    request.post(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(201);
      expect(body).to.have.property('_id');
      expect(body).to.have.property('__v');
      expect(body).to.have.property('name', "Lou's");
      done();
    });
  });

  it('should support finding documents with custom findBy field', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Camembert',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('color', 'White');
      done();
    });
  });

  it('should disallow adding a non-unique findBy field', function (done) {
    var makeController = function () {
      baucis.rest({ singular: 'cheese', findBy: 'color', publish: false });
    };
    expect(makeController).to.throwException(/findBy path for model "cheese" not unique[.]/);
    done();
  });

  it('should allow adding a uniqe findBy field 1', function (done) {
    var makeController = function () {
      var rab = new mongoose.Schema({ 'arb': { type: String, unique: true } });
      mongoose.model('rab', rab);
      baucis.rest({ singular: 'rab', findBy: 'arb', publish: false });
    };
    expect(makeController).not.to.throwException();
    done();
  });

  it('should allow adding a unique findBy field 2', function (done) {
    var makeController = function () {
      var barb = new mongoose.Schema({ 'arb': { type: String, index: { unique: true } } });
      mongoose.model('barb', barb);
      baucis.rest({ singular: 'barb', findBy: 'arb', publish: false });
    };
    expect(makeController).not.to.throwException();
    done();
  });

  it('should allow adding arbitrary routes', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/info',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.be('OK!');
      done();
    });
  });

  it('should allow adding arbitrary routes with params', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/XYZ/arbitrary',
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.be('XYZ');
      done();
    });
  });

  it('should still allow using baucis routes when adding arbitrary routes', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores',
      qs: { select: '-_id -__v', sort: 'name' },
      json: true
    };
    request.get(options, function (err, response, body) {
      if (err) return done(err);
      expect(response.statusCode).to.be(200);
      expect(body).to.eql([ { name: 'Corner' }, { name: 'Westlake' } ]);
      done();
    });
  });

  it('should allow mounting of subcontrollers (GET plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools?sort=name',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('length', 3);
      expect(body[0]).to.have.property('name', 'Axe');
      done();
    });
  });

  it('should allow mounting of subcontrollers (POST plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools',
      json: { name: 'Reticulating Saw' }
    };
    request.post(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(201);
      expect(body).to.have.property('bogus', false);
      done();
    });
  });

  it('should allow mounting of subcontrollers (DEL plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools',
      json: true
    };
    request.del(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.be(3);
      done();
    });
  });

  it('should allow mounting of subcontrollers (GET singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools?sort=name',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('length', 3);
      expect(body[0]).to.have.property('name', 'Axe');

      var id = body[0]._id;
      var options = {
        url: 'http://localhost:8012/api/stores/123/tools/' + id,
        json: true
      };
      request.get(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(200);
        expect(body).to.have.property('name', 'Axe');
        done();
      });
    });
  });

  it('should allow mounting of subcontrollers (PUT singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      var id = body[0]._id;
      var options = {
        url: 'http://localhost:8012/api/stores/123/tools/' + id,
        json: { name: 'Screwdriver' }
      };
      request.put(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(200);
        expect(body).to.have.property('name', 'Screwdriver');
        expect(body).to.have.property('bogus', false);
        done();
      });
    });
  });

  it('should allow mounting of subcontrollers (DEL singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/123/tools?sort=name',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('length', 3);
      expect(body[0]).to.have.property('name', 'Axe');

      var id = body[0]._id;
      var options = {
        url: 'http://localhost:8012/api/stores/123/tools/' + id,
        json: true
      };
      request.del(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(200);
        expect(body).to.be(1);
        done();
      });
    });
  });

  it('should allow parent to function when mounting subcontrollers (GET plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/?sort=name',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.length(2);
      done();
    });
  });

  it('should allow parent to function when mounting subcontrollers (POST plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/',
      json: { name: 'Arena' }
    };
    request.post(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(201);
      expect(body).not.to.have.property('bogus');
      done();
    });
  });

  it('should allow parent to function when mounting subcontrollers (DELETE plural)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/',
      json: true
    };
    request.del(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.be(2);
      done();
    });
  });

  it('should allow parent to function when mounting subcontrollers (GET singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('name', 'Westlake');
      done();
    });
  });

  it('should allow parent to function when mounting subcontrollers (PUT singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      json: { mercoledi: false, __v: 0 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.have.property('mercoledi', false);
      done();
    });
  });

  it('should allow parent to function when mounting subcontrollers (DELETE singular)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      json: true
    };
    request.del(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.be(1);
      done();
    });
  });

  it('should allow using middleware', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores',
      json: true
    };
    request.del(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(response.headers['x-poncho']).to.be('Poncho!');
      done();
    });
  });

  it('should allow using middleware mounted at a path', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/binfo',
      json: true
    };
    request.post(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);
      expect(body).to.be('Poncho!');
      done();
    });
  });

  it('should not allow query middleware to be explicitly registered for POST', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () { controller.query('get put head del post', function () {}) };
    expect(register).to.throwException(/Query stage not executed for POST./);
    done();
  });

  it('should ignore implicitly registered query middleware for POST', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () { controller.query(function () {}) };
    expect(register).not.to.throwException();
    done();
  });

  it('should disallow unrecognized verbs', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () { controller.request('get dude', function () {}) };
    expect(register).to.throwException(/Unrecognized verb./);
    done();
  });

  it('should disallow unrecognized howManys', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () { controller.request('gargoyle', 'get put', function () {}) };
    expect(register).to.throwException(/Unrecognized howMany: gargoyle/);
    done();
  });

  it('should allow specifying instance or collection middleware', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () {
      controller.request('collection', 'get put head del post', function () {});
      controller.request('instance', 'get put head del post', function () {});
    };
    expect(register).to.not.throwException();
    done();
  });

  it('should allow registering query middleware for other verbs', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () { controller.query('get put head del', function () {}) };
    expect(register).not.to.throwException();
    done();
  });

  it('should allow registering POST middleware for other stages', function (done) {
    var controller = baucis.rest({ singular: 'store', publish: false });
    var register = function () {
      controller.request('post', function () {});
      controller.documents('post', function () {});
    };

    expect(register).not.to.throwException();
    done();
  });

  it('should correctly set the deselected paths property', function (done) {
    var doozle = new mongoose.Schema({ a: { type: String, select: false }, b: String, c: String, d: String });
    mongoose.model('doozle', doozle);
    var controller = baucis.rest({ singular: 'doozle', select: '-d c -a b', publish: false });
    expect(controller.get('deselected paths')).eql([ 'a', 'd' ]);
    done();
  });

  it('should err when X-Baucis-Push is used (deprecated)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: { 'X-Baucis-Push': true },
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(400);
      expect(body).to.contain('The &quot;X-Baucis-Push header&quot; is deprecated.  Use &quot;X-Baucis-Update-Operator: $push&quot; instead.');
      done();
    });
  });

  it('should disallow push mode by default', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: { 'X-Baucis-Update-Operator': '$push' },
      json: true,
      body: { molds: 'penicillium roqueforti', __v: 0 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain('Update operator not enabled for this controller: $push');
      done();
    });
  });

  it('should disallow pushing to non-whitelisted paths', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$push' },
      json: true,
      body: { 'favorite nes game': 'bubble bobble' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain("Can't use update operator with non-whitelisted paths.");
      done();
    });
  });

  it("should allow pushing to an instance document's whitelisted arrays when $push mode is enabled", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$push' },
      json: true,
      body: { molds: 'penicillium roqueforti' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('molds');
      expect(body.molds).to.have.property('length', 1);
      expect(body.molds).to.eql([ 'penicillium roqueforti' ]);

      done();
    });
  });

  it('should disallow $pull mode by default', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: { 'X-Baucis-Update-Operator': '$pull' },
      json: true,
      body: { molds: 'penicillium roqueforti', __v: 0 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain('Update operator not enabled for this controller: $pull');
      done();
    });
  });

  it('should disallow pulling non-whitelisted paths', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$pull' },
      json: true,
      body: { 'favorite nes game': 'bubble bobble' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain("Can't use update operator with non-whitelisted paths.");
      done();
    });
  });

  it("should allow pulling from an instance document's whitelisted arrays when $pull mode is enabled", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$push' },
      json: true,
      body: { molds: 'penicillium roqueforti' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('molds');
      expect(body.molds).to.have.property('length', 1);
      expect(body.molds).to.eql([ 'penicillium roqueforti' ]);

      options.headers['X-Baucis-Update-Operator'] = '$pull';

      request.put(options, function (error, response, body) {
        if (error) return done(error);

        expect(response.statusCode).to.be(200);

        expect(body).to.have.property('molds');
        expect(body.molds).to.have.property('length', 0);

        done();
      });
    });
  });

  it('should disallow push mode by default', function (done) {
    var options = {
      url: 'http://localhost:8012/api/stores/Westlake',
      headers: { 'X-Baucis-Update-Operator': '$set' },
      json: true,
      body: { molds: 'penicillium roqueforti', __v: 0 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain('Update operator not enabled for this controller: $set');
      done();
    });
  });

  it('should disallow setting non-whitelisted paths', function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$set' },
      json: true,
      body: { 'favorite nes game': 'bubble bobble' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(403);
      expect(body).to.contain("Can't use update operator with non-whitelisted paths.");
      done();
    });
  });

  it("should allow setting an instance document's whitelisted paths when $set mode is enabled", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Huntsman',
      headers: { 'X-Baucis-Update-Operator': '$set' },
      json: true,
      body: { molds: ['penicillium roqueforti'] }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('molds');
      expect(body.molds).to.have.property('length', 1);
      expect(body.molds).to.eql([ 'penicillium roqueforti' ]);

      done();
    });
  });

  it("should allow pushing to embedded arrays using positional $", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Camembert',
      headers: { 'X-Baucis-Update-Operator': '$push' },
      json: true,
      qs: { conditions: JSON.stringify({ 'arbitrary.goat': true }) },
      body: { 'arbitrary.$.llama': 5 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('arbitrary');
      expect(body.arbitrary).to.have.property('length', 2);
      expect(body.arbitrary[0]).to.have.property('llama');
      expect(body.arbitrary[0].llama).to.have.property('length', 3);
      expect(body.arbitrary[0].llama[0]).to.be(3);
      expect(body.arbitrary[0].llama[1]).to.be(4);
      expect(body.arbitrary[0].llama[2]).to.be(5);
      expect(body.arbitrary[1].llama).to.have.property('length', 2);
      expect(body.arbitrary[1].llama[0]).to.be(1);
      expect(body.arbitrary[1].llama[1]).to.be(2);

      done();
    });
  });

  it("should allow setting embedded fields using positional $", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Camembert',
      headers: { 'X-Baucis-Update-Operator': '$set' },
      json: true,
      qs: { conditions: JSON.stringify({ 'arbitrary.goat': false }) },
      body: { 'arbitrary.$.champagne': 'extra dry' }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('arbitrary');
      expect(body.arbitrary).to.have.property('length', 2);
      expect(body.arbitrary[0]).not.to.have.property('champagne');
      expect(body.arbitrary[1]).to.have.property('champagne', 'extra dry');

      done();
    });
  });

  it("should allow pulling from embedded fields using positional $", function (done) {
    var options = {
      url: 'http://localhost:8012/api/cheeses/Camembert',
      headers: { 'X-Baucis-Update-Operator': '$pull' },
      json: true,
      qs: { conditions: JSON.stringify({ 'arbitrary.goat': true }) },
      body: { 'arbitrary.$.llama': 3 }
    };
    request.put(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      expect(body).to.have.property('arbitrary');
      expect(body.arbitrary).to.have.property('length', 2);
      expect(body.arbitrary[0]).to.have.property('llama');
      expect(body.arbitrary[0].llama).to.have.property('length', 1);
      expect(body.arbitrary[0].llama[0]).to.be(4);
      expect(body.arbitrary[1].llama).to.have.property('length', 2);
      expect(body.arbitrary[1].llama[0]).to.be(1);
      expect(body.arbitrary[1].llama[1]).to.be(2);

      done();
    });
  });

  it('should send 405 when a verb is disabled (GET)', function (done) {
    request.get('http://localhost:8012/api/beans', function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(405);
      expect(response.headers).to.have.property('allow', 'HEAD,POST,PUT,DELETE');
      done();
    });
  });

  it('should send 405 when a verb is disabled (DELETE)', function (done) {
    request.del('http://localhost:8012/api/liens', function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(405);
      expect(response.headers).to.have.property('allow', 'HEAD,GET,POST,PUT');
      done();
    });
  });

  it('should return a 400 when ID malformed (not ObjectID)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/beans/bad',
      json: true
    };
    request.head(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(400);
      done();
    });
  });

  it('should return a 400 when ID malformed (not Number)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/deans/0booze',
      json: true
    };
    request.head(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(400);
      done();
    });
  });

  it('should send "409 Conflict" if there is a version conflict', function (done) {
    var options = {
      url: 'http://localhost:8012/api/liens',
      json: true,
      body: { title: 'Franklin' }
    };
    request.post(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(201);

      var options = {
        url: 'http://localhost:8012/api/liens/' + body._id,
        json: true,
        body: { title: 'Ranken', __v: 0 }
      };

      request.put(options, function (error, response, body) {
        if (error) return done(error);

        expect(response.statusCode).to.be(200);

        request.put(options, function (error, response, body) {
          if (error) return done(error);
          console.log(body)
          expect(response.statusCode).to.be(409);
          done();
        });
      });
    });
  });

  it('should send "409 Conflict" if there is a version conflict (greater than)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/liens',
      json: true,
      body: { title: 'Smithton' }
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      var options = {
        url: 'http://localhost:8012/api/liens/' + body[1]._id,
        json: true,
        body: { __v: body[1].__v + 10 }
      };
      request.put(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(409);
        done();
      });
    });
  });

  it('should not send "409 Conflict" if there is no version conflict (equal)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/liens',
      json: true
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      var options = {
        url: 'http://localhost:8012/api/liens/' + body[1]._id,
        json: true,
        body: { __v: body[1].__v }
      };
      request.put(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(200);
        done();
      });
    });
  });

  it('should cause an error if locking is enabled and no version is selected on the doc', function (done) {
    var options = {
      url: 'http://localhost:8012/api/liens',
      json: true,
      body: { title: 'Forest Expansion' }
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      var options = {
        url: 'http://localhost:8012/api/liens/' + body[0]._id,
        json: true,
        qs: { select: '-__v' },
        body: { __v: 1000 }
      };
      request.put(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(400);
        done();
      });
    });
  });

  it('should cause an error if locking is enabled and no version is selected', function (done) {
    var options = {
      url: 'http://localhost:8012/api/liens',
      json: true,
      body: { title: 'Forest Expansion' }
    };
    request.get(options, function (error, response, body) {
      if (error) return done(error);
      expect(response.statusCode).to.be(200);

      var options = {
        url: 'http://localhost:8012/api/liens/' + body[0]._id,
        json: true,
        qs: { select: '-__v' },
        body: { __v: 1000 }
      };
      request.put(options, function (error, response, body) {
        if (error) return done(error);
        expect(response.statusCode).to.be(400);
        done();
      });
    });
  });

  it('should not send 409 if locking is not enabled');

});
