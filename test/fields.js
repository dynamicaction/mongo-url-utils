const expect = require('chai').expect;
const mongoUrl = require('..');

describe('fields', () => {

  it('should return an error with invalid syntax', () => {
    expect(() => mongoUrl.fields('invalid_fields')).to.throw(/^Expected/);
  });

  it('should include fields prefixed with `+`', () => {
    expect(mongoUrl.fields('+name')).to.eql({name: 1});
  });

  it('should exclude fields prefixed with `-`', () => {
    expect(mongoUrl.fields('-email')).to.eql({email: 0});
  });

  it('should include multiple fields prefixed with `+`', () => {
    expect(mongoUrl.fields('+name,+email')).to.eql({name: 1, email: 1});
    expect(mongoUrl.fields('+name,+email,+id')).to.eql({name: 1, email: 1, id: 1});
  });

  it('should exclude multiple fields prefixed with `-`', () => {
    expect(mongoUrl.fields('-name,-email')).to.eql({name: 0, email: 0});
    expect(mongoUrl.fields('-name,-email,-id')).to.eql({name: 0, email: 0, id: 0});
  });

  it('should throw an error when there are mixed include and exclude', () => {
    expect(mongoUrl.fields.bind(null, '-name,+email')).to.throw('Expected "-"');
    expect(mongoUrl.fields.bind(null, '-name,+_id')).to.throw('Expected "-"');
  });

  it('should not throw an error when the only mixed exclusive field is _id', () => {
    expect(mongoUrl.fields('+email,-_id')).to.eql({email: 1, _id: 0});
    expect(mongoUrl.fields('-_id,+email')).to.eql({_id: 0, email: 1});
  });

  it('should throw an error if fields are not prefixed with -/+', () => {
    expect(mongoUrl.fields.bind(null, 'name')).to.throw('Expected ');
    expect(mongoUrl.fields.bind(null, '+name,email')).to.throw('Expected ');
  });

  it('should throw an error when a property name starts with a $', () => {
    expect(mongoUrl.fields.bind(null, '+$cannotStartWithDollar')).to.throw('Expected ');
  });

  it('should support properties with a $ not at the start', () => {
    expect(mongoUrl.fields('+canContain$')).to.eql({canContain$: 1});
    expect(mongoUrl.fields('+can$ContainDollar')).to.eql({can$ContainDollar: 1});
  });

  it('should support properties with a range of weird and wonderful chars', () => {
    expect(mongoUrl.fields('+canContain☠')).to.eql({'canContain☠': 1});
  });

  it('should throw an error when a property name includes a null char', () => {
    expect(mongoUrl.fields.bind(null, '+cannotHaveNullChar\0')).to.throw('Expected ');
  });

  it('should throw when a property has a dot at the start', () => {
    expect(mongoUrl.fields.bind(null, '+.noStartDot')).to.throw('Expected ');
  });

  it.skip('should throw when a property has a dot at the end', () => {
    expect(mongoUrl.fields.bind(null, '+noEndDot.')).to.throw('Expected ');
  });

  it('should support dot notation properties', () => {
    expect(mongoUrl.fields('+deep.property')).to.eql({'deep.property': 1});
  });

  it('should treat space like literal `+` in querystring by default', () => {
    expect(mongoUrl.fields('+include')).to.eql({include: 1});
  });

  it('should not treat space like literal `+` if strictEncoding option is true', () => {
    expect(mongoUrl.fields.bind(null, ' include', {strictEncoding: true})).to.throw('Expected "+" or "-"; disable strictEncoding to allow space in place of +');
  });

  it('should recognise an elemMatch query', () => {
    expect(mongoUrl.fields('elemMatch(students,eq(school,102))')).to.eql({
      students:{
        $elemMatch:{
          school:{
            $eq:102
          }
        }
      }
    });
  });

  it('should mix elemMatch and inclusive projection', () => {
    const expected = {
      name: 1,
      students:{
        $elemMatch:{
          school:{
            $eq:102
          }
        }
      }
    };
    expect(mongoUrl.fields('+name,elemMatch(students,eq(school,102))')).to.eql(expected);
    expect(mongoUrl.fields('elemMatch(students,eq(school,102)),+name')).to.eql(expected);
  });

  it('should mix elemMatch and exclusive projection', () => {
    const expected = {
      name: 0,
      students:{
        $elemMatch:{
          school:{
            $eq:102
          }
        }
      }
    };
    expect(mongoUrl.fields('-name,elemMatch(students,eq(school,102))')).to.eql(expected);
  });

  it.skip('should mix elemMatch and exclusive projection when elemMatch is first', () => {
    const expected = {
      name: 0,
      students:{
        $elemMatch:{
          school:{
            $eq:102
          }
        }
      }
    };
    expect(mongoUrl.fields('elemMatch(students,eq(school,102)),-name')).to.eql(expected);
  });

});
