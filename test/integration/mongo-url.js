var tests = [
  [
    {
      query: 'eq(id,1)'
    },
    [1]
  ],
  [
    {
      query: 'lt(id,5)'
    },
    [1,2,3,4]
  ],
  [
    {
      query: 'lt(id,5)',
      sort: '-id'
    },
    [4,3,2,1]
  ],
  [
    {
      query: 'lt(id,5)',
      sort: '+id'
    },
    [1,2,3,4]
  ],
  [
    'query=lt(id,5)&sort=+id',
    [1,2,3,4]
  ],
  [
    {
      limit: '2'
    },
    [1,2]
  ],
  [
    {
      limit: '2',
      skip: '2'
    },
    [3,4]
  ],
  [
    'query=gt(id,1)&limit=2',
    [2,3]
  ],
  [
    'query=or(gt(grades.date,Date(2015-04-28T17:00Z)),eq(restaurant_id,"9353217"))',
    [1,7,10]
  ]
];

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var parse = require('../..');

const URL = process.env.MONGO_URL || 'mongodb://localhost:27017/test?nativeParser=false';
const DEBUG = process.env.DEBUG;

var getTestAsset = require('../tools/get-test-asset');

var docs;
before(function (done) {
  MongoClient.connect(URL, {}, function (err, db) {
    if (err) return done(err);
    docs = db.collection('mongo-url-test');
    docs.drop(function () {
      //ignore error dropping a collection that probably wont be there
      docs.ensureIndex({name: 'text'}, done);
    });
  });
});

after(function (done) {
  if (DEBUG) return done();
  docs.drop(done);
});

describe('mongo-url integration test:', function() {

  var data = getTestAsset('test_data.json');
  data.forEach(function (doc) {
    before(function (done) {
      docs.insert(doc, done);
    });
  });

  tests.forEach(function (test) {
    var query = test[0];
    var name = typeof query === 'string' ? query : JSON.stringify(query);
    it(name, function (done) {
      var parsed = parse(query);
      if (DEBUG) console.dir(parsed);
      docs.find(parsed.query, parsed.options).toArray(function (err, docs) {
        if (err) return done(err);
        var expected = test[1];
        expect(pluck(docs, 'id')).to.eql(expected);
        done();
      });
    });
  });

  it('{fields:"+_id,+name"}', function (done) {
    var parsed = parse({fields:'+name'});
    docs.find({}, parsed.options).toArray(function (err, docs) {
      if (err) return done(err);
      docs.forEach(function (doc) {
        expect(doc).to.have.all.keys('_id', 'name');
      });
      done();
    });
  });

  it('{fields:"-_id,+name"}', function (done) {
    var parsed = parse({fields:'-_id,+name'});
    docs.find({}, parsed.options).toArray(function (err, docs) {
      if (err) return done(err);
      docs.forEach(function (doc) {
        expect(doc).to.have.all.keys('name');
      });
      done();
    });
  });

  it('{fields:"-name,-address,-borough,-closed"}', function (done) {
    var parsed = parse({fields:'-name,-address,-borough,-closed'});
    docs.find({}, parsed.options).toArray(function (err, docs) {
      if (err) return done(err);
      docs.forEach(function (doc) {
        expect(doc).to.have.all.keys('_id','cuisine','grades','id','restaurant_id');
      });
      done();
    });
  });

  describe('findIn', function(done) {
    it('should return a mongo cursor', function (done) {
      parse.findIn(docs, 'query=lt(id,3)').toArray(function (err, res) {
        if (err) return done(err);
        expect(res).to.be.an('array').and.have.length(2);
        expect(res[0]).to.have.property('id', 1);
        expect(res[1]).to.have.property('id', 2);
        done();
      });
    });
  });

  describe('findOneIn', function(done) {
    it('should return a single document', function (done) {
      parse.findOneIn(docs, 'query=eq(id,3)', function (err, res) {
        if (err) return done(err);
        expect(res).to.have.property('id', 3);
        done();
      });
    });
  });

});


function pluck(array, prop) {
  return array.map(function (v) {
    return v[prop];
  });
}
